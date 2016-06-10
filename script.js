var app = new JakesWall();

function JakesWall() {
  var JW = {};
  init();
  return JW;

  function init() {
    setData();
    setDOM();
    requestNotes();
  }

  function setData() {
    JW.current_item = 0;
    JW.time = 10000;
    JW.check = 2;
    JW.checks = 0;
    JW.data = {
      wall: null, notey: null, res: null
    }
  }

  function setDOM() {
    JW.$content = document.getElementById('content');
    JW.$area = document.createElement('div');
    JW.$text = document.createElement('div');
    JW.$media = document.createElement('div');
    JW.$author = document.createElement('p');
    JW.$area.appendChild(JW.$author);
    JW.$content.appendChild(JW.$media);
    JW.$content.appendChild(JW.$text);
    JW.$content.appendChild(JW.$area);
    JW.$content.classList.add('active');
    JW.$area.classList.add('area');
    JW.$media.classList.add('media');
    JW.$text.classList.add('text');
  }

  function requestNotes() {
    JW.current_item = 0;
    JW.checks = 0;
    // this requests the file and executes a callback with the parsed result once
    //   it is available
    fetchJSONFile('http://jakes-wall.herokuapp.com/', function(data) {
    // fetchJSONFile('http://localhost:3000/', function(data){
      JW.data.wall = data;
      fetchJSONFile('http://noteyapp.herokuapp.com/notes', function(d) {
        // do something with your data
        JW.data.notey = d;
        mergeData();
        processData();
      });
    });
  }

  function mergeData() {
    if(JW.data.wall.length > JW.data.notey.length) {
      var main = JW.data.wall, merge = JW.data.notey;
    } else {
      var main = JW.data.notey, merge = JW.data.wall;
    }

    JW.data.res = [];
    for(var i = 0; i < main.length; i++) {
      JW.data.res.push(main[i]);
      if(merge[i]) JW.data.res.push(merge[i]);
    }
  }

  function processData() {
    var item = JW.data.res[JW.current_item];
    if(item.hashid) {
      handleNotey();
    } else {
      handleWall();
    }

    setTimeout(function() {
      if(JW.checks > 0 && JW.checks % JW.check === 0) {
        requestNotes();
      } else {
        processData();
      }
    }, JW.time);
  }

  function handleNotey() {
    var item = JW.data.res[JW.current_item];
    var c = item.color || '#FFF';
    var img = item.image_url;
    var hsl = color2color(c, 'hsl');
    var color = '#222';
    var lit = hsl.match(/, ?(\d+)\%\)$/g)[0].replace(',', '').replace('%)','');
    c = color2color(c, 'rgb');
    JW.rgba = c.replace('rgb', 'rgba').replace(')', ',0.8)');
    lit = parseInt(lit);
    if(lit < 80) color = '#FFF';

    JW.$content.classList.remove('active');
    JW.$text.style.backgroundColor = '';
    setTimeout(function() {
      resetDOM();
      document.body.style.backgroundColor = item.color;
      document.body.style.color = color;
      JW.$area.style.backgroundColor = JW.rgba;
      JW.$author.innerHTML = (item.slack_user) ? item.slack_user + " (" + item.user.username + ")" : item.user.username;
      JW.$text.innerHTML = item.filtered_message;
      // JW.$text.style.backgroundColor = JW.rgba;
      JW.$text.style.textShadow = '8px 8px 0px ' + JW.rgba;
      if(img) {
        JW.$media.style.backgroundImage = 'url(' + img + ')';
      }
      JW.$content.classList.add('active');
    }, 1000);

    count();
  }

  function handleWall() {
    var item = JW.data.res[JW.current_item];
    var c = item.color.css || '#FFF';
    JW.rgba = c.replace('rgb', 'rgba').replace(')', ',0.8)');
    var media = item.media_url;
    var type = media && media.match(/\.mp4$/g) ? 'video' : 'image'
    var hsl = item.color.hsl;
    var lit = hsl.l;
    var color = (lit < 0.7) ? 'white' : 'black';

    JW.$content.classList.remove('active');
    JW.$text.style.backgroundColor = '';
    setTimeout(function() {
      resetDOM();
      document.body.style.backgroundColor = item.color.css;
      document.body.style.color = color;
      JW.$area.style.backgroundColor = JW.rgba;
      var profile_pic = new Image();
      profile_pic.src = item.profile_image_url;
      JW.$author.appendChild(profile_pic);
      JW.$author.innerHTML += '<a href="' + item.author_link + '">@' + item.username + '</a>';
      if(item.location) {
        JW.$author.innerHTML += '<span>' + item.location + '</span>';
      }

      if(item.text) {
        JW.$text.innerHTML = '<a href="' + item.link + '">' + item.text + '</a>';
      }

      // JW.$text.style.backgroundColor = JW.rgba;
      JW.$text.style.textShadow = '8px 8px 0px ' + JW.rgba;

      if(media) {
        if(type === 'image') {
          JW.$media.style.backgroundImage = 'url(' + media + ')';
        } else {
          var video = document.createElement('video');
          video.src = media;
          video.setAttribute('muted', '');
          if(video.videoWidth > 0) {
            var w = video.videoWidth;
            var h = video.videoHeight;
            var wh = window.innerHeight;
            var ww = window.innerWidth;
            video.classList.add('active');
            if(h / w > wh / ww) {
              video.style.height = wh + 'px';
            } else {
              video.style.width = ww + 'px';
            }
          } else {
            video.addEventListener('loadedmetadata', function(e) {
              var w = e.target.videoWidth;
              var h = e.target.videoHeight;
              var wh = window.innerHeight;
              var ww = window.innerWidth;
              e.target.classList.add('active');
              if(h / w > wh / ww) {
                e.target.style.height = wh + 'px';
              } else {
                e.target.style.width = ww + 'px';
              }
              var clone1 = e.target.cloneNode();
              var clone2 = e.target.cloneNode();
              var media = document.querySelector('.media');
              media.appendChild(clone1);
              media.appendChild(clone2);
            });
          }
          video.setAttribute('loop', true);
          video.setAttribute('autoplay', true);
          JW.$media.appendChild(video);
        }
      }
      JW.$content.classList.add('active');
    }, 1000);

    count();
  }

  function count() {
    if(JW.current_item < JW.data.res.length - 1) {
      JW.current_item++;
    } else {
      JW.current_item = 0;
      JW.checks++;
    }
  }

  function resetDOM() {
    JW.$text.innerHTML = '';
    JW.$media.innerHTML = '';
    JW.$media.style.backgroundImage = '';
    JW.$author.innerHTML = '';
    JW.$area.style.backgroundColor = '';
  }

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4) {
        if (httpRequest.status === 200) {
          var data = JSON.parse(httpRequest.responseText);
          if (callback) callback(data);
        }
      }
    };
    httpRequest.open('GET', path);
    httpRequest.send();
  }
}



