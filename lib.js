/*
* Product Tour JS
* author: Francesco Rizzi
* url: http://francescorizzi.info/projects/product-tour-js/
* requires: jQuery
* */

window.ProductTourJS = {
	
	tips            : false,
	options         : false,
	currentTip      : 0,
	totalSteps      : 0,
	eventsSet       : false,
	$mainWrapper    : false,
	$darkenLayer    : false,
	$current        : false,
	semaphore       : false,
	semaphoreResize : false,
	defaultsOptions : {
		darkLayerPersistence : false,
		next                 : 'Next',
		prev                 : 'Previous',
		finish               : 'Okay!',
		mobileThreshold      : 768,
	},
	
	init : function( options ){
		
		this.tips    = options.tips;
		this.options = Object.assign({}, this.defaultsOptions, options.options);
		
		if ( this.baseCheckOptions() ) {
			
			this.totalSteps = this.tips.length;
			$(".product-tour-js-cover-layer, .product-tour-js-single-step").remove();
			
			this.$mainWrapper = $("body");
			this.$darkenLayer = $('<div class="product-tour-js-cover-layer"></div>');
			this.$mainWrapper.append(this.$darkenLayer);
			this.htmlInit(this.$mainWrapper);
			this.bindEvents();
			
			return true;
			
		}
	},
	
	start : function(){
		
		if ( this.baseCheckOptions() && this.totalSteps > 0 ) {
			
			this.setPositions();
			this.currentTip = 0;
			
			this.options.darkLayerPersistence && this.$darkenLayer.addClass("is-always-visible");
			this.darken();
			
			this.$current = $(".product-tour-js-single-step.js-product-tour-index-0").addClass("is-selected");
			this.$mainWrapper.addClass("product-tour-js-active");
			
			return true;
			
		}
		
	},
	
	baseCheckOptions : function(){
		
		let ok = this.tips && Array.isArray(this.tips) && "object" === typeof(this.tips[ 0 ]);
		if ( !ok ) {
			throw new Error("product-tour-js: Invalid config options.");
		}
		return ok;
		
	},
	
	bindEvents : function(){
		
		if ( !this.eventsSet ) {
			
			let self     = this;
			let $wrapper = $("html");
			
			let onNext = function(){
				return self.goNext()
			};
			
			let onPrev = function(){
				return self.goPrev()
			};
			
			let onClose = function(){
				return self.exit()
			};
			
			$wrapper.on("click", ".product-tour-js-prev", onPrev);
			$wrapper.on("click", ".product-tour-js-next", onNext);
			$wrapper.on("swiperight", onPrev);
			$wrapper.on("swipeleft", onNext);
			
			$wrapper.keyup(function( e ){
				"37" == e.which ? onPrev() : ("39" == e.which ? onNext() : ("27" == e.which ? onClose() : null));
			});
			
			$wrapper.on("click", ".js-product-tour-js-tour-close", onClose);
			$wrapper.on("click", ".js-product-tour-js-tour-start", this.start.bind(this));
			$(window).on("resize", this.onResizeCallable.bind(this));
			
			this.eventsSet = true;
			
		}
		
	},
	
	navigationInit : function(){
		
		let html = '<div class="product-tour-js-nav"><span class="product-tour-js-nav-numeric"><b class="product-tour-js-actual-step">1</b> of ' + this.totalSteps + '</span><ul class="product-tour-js-tour-nav"><li><a href="#0" class="product-tour-js-prev">' + this.options.prev + '</li><li><a href="#0" class="product-tour-js-next">' + this.options.next + '</a></li></ul></div><a href="#0" class="product-tour-js-close js-product-tour-js-tour-close">Close</a>';
		let self = this;
		
		$.each(this.tips, function( tipIndex ){
			
			let elem      = $(".product-tour-js-single-step.js-product-tour-index-" + tipIndex);
			let nextIndex = tipIndex + 1;
			let nextClass = nextIndex < self.totalSteps ? "" : "inactive";
			let prevClass = 1 === nextIndex ? "inactive" : "";
			html          = tipIndex + 1 === self.tips.length ? html + '<div class="product-tour-js-single-step-final-btn js-product-tour-js-tour-close ">' + self.options.finish + '</div>' : html;
			let $html     = $(html);
			
			$html.find(".product-tour-js-next").addClass(nextClass);
			$html.find(".product-tour-js-prev").addClass(prevClass);
			$html.find(".product-tour-js-actual-step").html(nextIndex);
			
			elem.find(".product-tour-js-single-step-inner").append($html);
			
		});
		
	},
	
	onSelected : function(){
		
		let self = this;
		let f    = this.tips[ this.currentTip ].onSelected;
		"function" == typeof f && f(self);
		
	},
	
	changeStep : function( direction ){
		
		if ( this.isStarted() ) {
			
			let nextStep = this.currentTip + ("next" === direction ? 1 : -1);
			
			if ( nextStep === this.totalSteps || nextStep === -1 ) {
				return false;
			}
			if ( !this.checkAndLock() ) {
				return false;
			}
			
			this.dispatch('on-product-tour-js-' + direction);
			
			this.$current.removeClass("is-selected");
			this.darken();
			this.$current   = $(".product-tour-js-single-step.js-product-tour-index-" + nextStep).addClass("is-selected");
			this.currentTip = nextStep;
			this.onSelected();
			
		}
		
	},
	
	dispatch : function( name ){
		if ( this.isStarted() ) {
			let self = this;
			$(window).trigger(name, self);
		}
	},
	
	goNext : function(){
		this.changeStep("next");
	},
	
	goPrev : function(){
		this.changeStep("prev");
	},
	
	darken : function(){
		let self = this;
		this.$darkenLayer.addClass("is-visible").on("webkitAnimationEnd msAnimationEnd animationend", function(){
			self.$darkenLayer.removeClass("is-visible")
		})
	},
	
	isStarted : function(){
		return !!this.$current;
	},
	
	exit : function(){
		
		this.dispatch('on-product-tour-js-exit');
		
		if ( this.isStarted() ) {
			this.$current.removeClass("is-selected");
		}
		this.$darkenLayer.removeClass("is-visible");
		this.$darkenLayer.removeClass("is-always-visible");
		this.$mainWrapper.removeClass("product-tour-js-active");
		this.$current = false;
		
	},
	
	isMobile : function(){
		return $(window).width() < this.options.mobileThreshold;
	},
	
	checkAndLock : function(){
		
		if ( this.isMobile() || this.options.darkLayerPersistence ) {
			return true;
		}
		
		let self = this;
		
		if ( self.semaphore === false ) {
			
			self.semaphore = true;
			setTimeout(function(){
				self.semaphore = false
			}, 2500);
			return true;
			
		}
		
	},
	
	getRelativePosition : function( e, x, y, offX, offY ){
		return {
			x : e.offset().left + e[ 0 ].offsetWidth / 100 * x + offX,
			y : e.offset().top + e[ 0 ].offsetHeight / 100 * y + offY
		}
	},
	
	onResizeCallable : function(){
		
		let self = this;
		
		if ( !self.semaphoreResize && !self.isMobile() ) {
			self.semaphoreResize = true;
			setTimeout(function(){
				self.setPositions();
				self.semaphoreResize = false;
			}, 300);
		}
		
	},
	
	setPositions : function(){
		
		let self = this;
		$.each(this.tips, function( index, tip ){
			self.setPosition(index, tip)
		})
		
	},
	
	setPosition : function( index, tip ){
		
		let elem      = $(tip.selector).eq(0);
		let positions = this.getRelativePosition(elem, tip.x, tip.y, tip.offx, tip.offy);
		
		$(".product-tour-js-single-step.js-product-tour-index-" + index).css({
																				 top  : positions.y + "px",
																				 left : positions.x + "px"
																			 });
		
	},
	
	htmlInit : function( $wrapper ){
		
		let html = "";
		let self = this;
		
		$.each(this.tips, function( index, tip ){
			html += "<div class='product-tour-js-single-step js-product-tour-index-" + index + "'><span class='product-tour-js-pulse'></span><div class='product-tour-js-single-step-inner is-" + tip.position + "'><div class='product-tour-js-progress'><span class='product-tour-js-progress-inner' style='width: " + Math.round((index + 1) / self.totalSteps * 100) + "%'></span></div><div class='product-tour-js-title'>" + tip.title + "</div><div class='product-tour-js-description'>" + tip.description + "</div><div class='product-tour-js-image' style='background-image: url(" + tip.image + ")'></div>" + (tip.additionalHtml || "") + "</div></div>"
		});
		
		$wrapper.append(html);
		this.navigationInit()
		
	}
	
};
