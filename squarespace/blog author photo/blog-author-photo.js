<script name="blog author photo" author="cregox.com">
  $(document).ready(function(){
    $('article').addClass('photo-added');
    $('.content-wrapper .post').each(function(){
      var $thumb = $(this).find('.excerpt-thumb').addClass('big-thumb');
      $thumb.parent().prepend($thumb);
      var imgSrc = $thumb.find('img').attr('src');
      imgSrc = imgSrc.split('?')[0] + '?format=900w';
      $thumb.find('img').attr('src', imgSrc);
      
      var $h3 = $(this).find('.body.entry-content>h3')
      if ($h3.length) {
        $h3.insertAfter($(this).find('header h1'));
      }
      
      var $body = $(this).find('.body.entry-content');
      $(this).find('footer.article-meta').insertBefore($body);
      $(this).find('.shareaholic-canvas').insertBefore($body);
    });
  });
  
  function ajaxRequest () {
    Y.io('/test?format=json', {
      on: {
        success: function (x, o) {
          var parsedResponse;
          try {
            d = Y.JSON.parse(o.responseText);
          } catch (e) {
            console.log("JSON Parse failed!");
            return;
          }
          for (var i = 0; i < d.items.length; i++) {
            var imgString = '<img class="avatar" src="'+ d.items[i].author['avatarAssetUrl'] +'">';
            var bioString = '<div class="bio">'+ d.items[i].author['bio'] +'</div>';
            Y.one('article#article-'+ d.items[i].id +' span.author a').prepend(imgString).append(bioString);
          }
        }
      }
    });
  }

  Y.use('node', function() {
    Y.on('domready', function() {
      ajaxRequest();
    });
  });
</script>