(function() {
  class ScrollPlay {

    constructor(atts){
      let { speed = 300, container = 'container', canvas= 'canvas', video = false, sequence = false, frames = false, inertia = 5} = atts;
      this.frameNumber = 1
      this.playbackConst = speed
      this.inertia = inertia
      this.container = document.getElementById(container)
      this.canvas = document.getElementById(canvas)
      this.vid = video != false ? document.getElementById(video) : false;
      this.ctx = this.canvas.getContext("2d");
      this.sequence = sequence
      this.frames = frames
      this.sequenceImages = []
      this.activeImage = 1
      this.imgloaded = false;
      this.maxHeight = 0
      this.canUpdate = true
      this.animation = null;

      this.loadVideo = this.loadVideo.bind(this)
      this.loadSequence = this.loadSequence.bind(this)
      this.updatePlayHead = this.updatePlayHead.bind(this)
      this.scrollListener = this.scrollListener.bind(this)
      this.setupVideo = this.setupVideo.bind(this)


      if (this.vid) {
        this.loadVideo();
      } else if (this.sequence) {
        this.loadSequence();
      }
    }
    loadVideo() {

      this.vid.addEventListener('loadedmetadata', this.setupVideo)
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      document.onreadystatechange = () => {
        if (document.readyState === 'complete') {
          if (this.vid.readyState >= 2) {
            this.setupVideo();
          }
        }
      }
    }
    loadSequence() {

      var loadtotal = this.sequenceImages.length;
      var sequence = []
      for (let i = 1; i <= (parseInt(this.frames) - 1); i ++) {
        sequence.push(this.sequence+`${`00${i}`.slice(-3)}.jpg`);
      }

      // Load the images
      const every_nth = (arr, nth) => arr.filter((e, i) => i % nth === nth - 1);
      var first = [sequence.shift()];
      var priority = every_nth(sequence, 10);
      var secondary = every_nth(sequence, 2);

      this.loadImages(first, loadtotal, true)
      this.loadImages(priority, loadtotal, false)
      this.loadImages(secondary, loadtotal, false)
      this.loadImages(sequence, loadtotal, false)

      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.maxHeight = Math.floor(this.sequenceImages.length) * this.playbackConst;
      this.container.style.minHeight = this.maxHeight + window.innerHeight + "px";
      document.addEventListener("scroll", this.scrollListener);
    }

    loadImages(sequence , total, preload = false) {
      var world = this;
      var loadcount = 0;
      for (var i=0; i<sequence.length; i++) {
          // Create the image object
          var image = new Image();

          // Add onload event handler
          image.onload = function () {
              loadcount++;
              if (loadcount == 1 && preload) {
                // get the scale
                console.log(this);
                var scale = Math.max(world.canvas.width / this.width, world.canvas.height / this.height);
                // get the top left position of the image
                var x = (world.canvas.width / 2) - (this.width / 2) * scale;
                var y = (world.canvas.height / 2) - (this.height / 2) * scale;
                world.ctx.drawImage(this, x, y, this.width * scale, this.height * scale);
              }

              if (loadcount == total) {
                  // Done loading
                  this.imgloaded = true;
              }
          };

          // Set the source url of the image
          image.src = sequence[i];
          var imgnum = parseInt(sequence[i].slice(-7).slice(0, 3));
          // Save to the image array
          this.sequenceImages[imgnum] = image;
      }
    }

    updatePlayHead() {
        const clamp = (num, a, b) => Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
        // window.cancelAnimationFrame(this.animation);

        var world = this;

        var step = function() {
          var timestamp = world.vid ? world.vid.currentTime : world.activeImage;

          if (world.vid) {

            var frame = ((world.frameNumber - timestamp)/world.inertia);
            var time = clamp((timestamp + frame), 0, world.vid.duration);
            video.onseeked = () => {
               world.vid.onseeked = null;

               if (world.frameNumber !== time.toFixed(1) && timestamp != 0) {
                 world.animation = window.requestAnimationFrame(step);

               } else {
                 document.addEventListener("scroll", world.scrollListener);
               }
            }
            if (typeof world.vid.fastSeek == 'function') {
              world.vid.fastSeek(time);
            }
            world.vid.currentTime = parseFloat(time);
            var scale = Math.max(world.canvas.width / 1920, world.canvas.height / 1080);
            // get the top left position of the image
            var x = (world.canvas.width / 2) - (1920 / 2) * scale;
            var y = (world.canvas.height / 2) - (1080 / 2) * scale;

            world.ctx.drawImage(world.vid, x, y, 1920 * scale, 1080 * scale);

          } else if (world.sequence) {
            var frame = (world.frameNumber - timestamp) * world.inertia;
            world.activeImage = parseFloat(world.frameNumber);
            var img = world.sequenceImages[clamp(world.activeImage.toFixed(0) - 1, 1, world.frames)];
            if (typeof img != 'undefined') {
              // get the scale
              var scale = Math.max(world.canvas.width / img.width, world.canvas.height / img.height);
              // get the top left position of the image
              var x = (world.canvas.width / 2) - (img.width / 2) * scale;
              var y = (world.canvas.height / 2) - (img.height / 2) * scale;

              world.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            }
          }

        }

        this.animation = window.requestAnimationFrame(step);

    }

    scrollListener(e) {
        document.addEventListener("scroll", this.scrollListener);
        var scrollPosition = window.pageYOffset - this.container.offsetTop

        // Animate
        if (scrollPosition >= 0 && scrollPosition <= this.maxHeight) {
          var thisframeNumber  = ((window.pageYOffset - this.container.offsetTop)/this.playbackConst).toFixed(1);
          if (thisframeNumber != this.frameNumber) {
            this.frameNumber = thisframeNumber;
            // document.removeEventListener("scroll", this.scrollListener);
            this.animation = window.requestAnimationFrame(this.updatePlayHead);
          }
        }
    }

    setupVideo() {
      this.maxHeight = this.vid.duration * this.playbackConst;
      this.container.style.minHeight = this.maxHeight + window.innerHeight + "px";
      document.addEventListener("scroll", this.scrollListener);
      this.vid.play();
      this.vid.pause();
      this.vid.currentTime = parseFloat(0);
      this.updatePlayHead();
    }
  }
  window.ScrollPlay = ScrollPlay;
})()
