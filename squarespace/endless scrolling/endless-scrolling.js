// initially based on a script from foley at
// http://answers.squarespace.com/questions/17153/how-can-i-create-an-infinite-scroll-blog-on-the-developer-platform

function endlessScrolling ()
{
  // config
  var thumbSize = 300; //px
  var loadingMargin = 500; //px
  var parent = 'main#main .wrapper';
  var list = '.summary-item-list';
  var post = '.summary-item';

  // private
  var jsonCachedRequest = null;
  var $parentToAppend;
  var $newItemToClone;
  var itemsLoaded = 0;
  var totalItemsCount = 0;// Static.SQUARESPACE_CONTEXT.collection.itemCount;
  var urlQuery = window.location.pathname;
  var stuffBottom;
  var $loadingIcon;
  var msnry;
  var createPageComplete = false;
  var layoutComplete = false;
  var initialScrollPosition;
  var pageId;
  var initialLocation;
  var currentWidth;

  initialLocation = document.location.href.split('#')[0];

  initialScrollPosition = window.scrollY;
  pageId = location.hash.slice(1);
  if ( pageId.slice(0,2) === 'p@' )
  {
    pageId = pageId.slice(2);
  }
  else
  {
    pageId = undefined;
  }

  $parentToAppend = $(parent).first().find('div');
  cacheAjaxRequest();
  
  itemsLoaded = $parentToAppend.find('.summary-item-list .summary-item').length;

  $loadingIcon = $('a[href^="javascript:endlessScrollingLoading"]').first();
  $loadingIcon.find('div.image-block-wrapper').first().css({'height': 'auto'});

  // almost all styles set in this whole script need to be set here
  // to overwrite styles already set on the element before this
  $parentToAppend.find('.summary-item').css({'width': 'initial'});
  
  $loadingIcon.find('img').first().css({
    'bottom': '',
    'top': '',
    'left': '',
    'right': '',
    'width': '',
    'height': '',
    'position': ''
  }).addClass('endless-loading').parent().css({'text-align': 'center'});
  $loadingIcon.find('div.image-block-wrapper').first().css({'padding-bottom': 0});
  $(parent).append($loadingIcon);
  
  $newItemToClone = $parentToAppend.find('.summary-item-list .summary-item').first().clone();
  $newItemToClone.addClass('cloned').hide();
  $parentToAppend.append($newItemToClone);
  $newItemToClone.find('img').first()
    .attr('src', '')
    .attr('data-src', '')
    .removeClass('positioned');

  $(parent).first().css({
    'background-color': '#e8edf3',
    'padding': '2em'
  });

  $(window).resize();
  $parentToAppend.find('.summary-item-list').first().css({'display': 'block'}); // with style, prevented summary to appear

  $(window).resize(function()
  {
    currentWidth = $('.summary-item-list .summary-item img').first().width();
    loadMasonry();
  });

  function loadMasonry ()
  {
    var container = document.querySelector(list);
    msnry = new Masonry( container,
    {
      'transitionDuration': 0,
      'gutter': 15,
      'itemSelector': '.summary-item',
      'isInitLayout': false
    });
    
    msnry.on( 'layoutComplete', function( laidOutItems )
    {
      $loadingIcon.find('img').hide();

      if (layoutComplete) return;

      if (createPageComplete)
      {
        $parentToAppend.find('.summary-item-list .summary-item').removeClass('invisible');
        $loadingIcon.remove();
        var position = initialScrollPosition;
        var $postPage = $(post+'#'+pageId).first();
        if ( $postPage && $postPage.offset() )
        {
          position = $postPage.offset().top;
        }
        window.scrollTo(0, position);
        layoutComplete = true;
      }
      else
      {
        resetScrollingVars();
      }
      return true; // listen to event only once
    });
    imagesLoaded( container, function()
    {
      msnry.layout();
    });
  }

  function resetScrollingVars ()
  {
    var parentChild = parent + '>div';
    stuffBottom = $(parentChild).get('clientHeight') + $(parentChild).offset().top;
    
    var windowHeight = window.innerHeight
     || document.documentElement.clientHeight
     || document.body.clientHeight;
    var spaceHeight = windowHeight + window.scrollY;

    // measures distance from page top to content bottom
    // should be less than scrollY position
    if (spaceHeight + loadingMargin >= stuffBottom)
    {
      if (spaceHeight > stuffBottom)
      {
        var $img = $loadingIcon.find('img:not(.fixed)');
        if ($img) $img.addClass('fixed');
      }
      else
      {
        var $img = $loadingIcon.find('img.fixed');
        if ($img) $img.removeClass('fixed');
      }
    }
  }

  function createLayout ()
  {
    if (jsonCachedRequest === null || createPageComplete) return false;

    $loadingIcon.find('img').show();

    var json = jsonCachedRequest;

    for (var i = itemsLoaded; i < totalItemsCount; i++)
    {
      var $newItem = $newItemToClone.clone().show();

      var itemPageId = json.items[i].fullUrl.split('/').pop();
      $newItem
        .attr('id', itemPageId)
        .addClass('invisible')
        .removeClass('cloned');

      setMouseHover($newItem);
      $parentToAppend.find('.summary-item-list').first().append($newItem);

      var imgSize = json.items[i].originalSize;
      var imgHeight = imgSize.split('x')[1];
      var imgRatio = imgSize.split('x')[0] / imgHeight;
      imgHeight = parseInt(currentWidth / imgRatio, 10);
      $newItem.find('img').first()
        .css({'opacity': 1, 'height': imgHeight + 'px !important'})
        .addClass('lazyload')
        .attr('data-image-dimensions', '')
        .attr('data-image', json.items[i].assetUrl)
        .attr('alt', '')
        .attr('data-src', json.items[i].assetUrl +'?format='+ thumbSize +'w')
        .attr('data-srcset',
          json.items[i].assetUrl +'?format=100w 100w'
          +','+ json.items[i].assetUrl +'?format=300w 300w'
          +','+ json.items[i].assetUrl +'?format=500w 500w'
        )
        //.getDOMNode().src = json.items[i].assetUrl +'?format=100w'
        .on('load', function()
        {
          $(this).css({'height': ''});
        })
      ;

      $newItem.find('a').first()
        .attr('href', json.items[i].fullUrl)
        .attr('click-href', initialLocation + '#p@' + itemPageId)
        .on('click', function() {
          history.replaceState({},'', this.getAttribute('click-href'));
        });

      $newItem.find('.product-price span').first().text(
        (json.items[i].variants[0].price / 100).toFixed(2)
      );
    }

    $('footer#footer').show();
    createPageComplete = true;

    return true;
  } // function createLayout

//////////////
// will remove all below here !!
//////////////

  function cacheAjaxRequest ()
  {
    if (jsonCachedRequest === null)
    {
      // ajax request
      Y.io('/shop?format=json', {
        on: {
          success: function (x, o) {
            try {
              json = Y.JSON.parse(o.responseText);
            } catch (e) {
              console.log("JSON Parse failed!");
              return;
            }

            // when done loading json

            jsonCachedRequest = json;
            totalItemsCount = json.items.length;

            resetScrollingVars();

            Y.one('body').simulate('resize'); // adjust items in the columns

            createLayout();
            loadMasonry();
          }
        }
      });
    }
  } // function cacheAjaxRequest

  function setMouseHover ($node)
  {
    $node.find('.summary-item img').on('mouseenter', function(e)
    {
      e.currentTarget.transition(
        {
          duration:0.5,
          opacity:0.5
        });
    });
    $node.find('.summary-item img').on('mouseleave', function(e)
    {
      e.currentTarget.transition(
        {
          duration:0.5,
          opacity:1
        });
    });
  } // function setMouseHover
} // function endlessScrolling