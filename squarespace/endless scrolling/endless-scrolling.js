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
  var YparentToAppend;
  var YnewItemToClone;
  var itemsLoaded = 0;
  var totalItemsCount = 0;// Static.SQUARESPACE_CONTEXT.collection.itemCount;
  var urlQuery = window.location.pathname;
  var stuffBottom;
  var YloadingIcon;
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

  YparentToAppend = Y.one(parent).one('div');
  cacheAjaxRequest();
  
  itemsLoaded = YparentToAppend.one('.summary-item-list').all('.summary-item').size();

  setMouseHover(YparentToAppend);

  YloadingIcon = Y.one('a[href^="javascript:endlessScrollingLoading"]');
  YloadingIcon.one('div.image-block-wrapper').setStyle('height', 'auto');

  // almost all styles set in this whole script need to be set here
  // to overwrite styles already set on the element before this
  YparentToAppend.all('.summary-item').setStyle('width', 'initial');
  
  YloadingIcon.one('img').setStyles({
    'bottom': '',
    'top': '',
    'left': '',
    'right': '',
    'width': '',
    'height': '',
    'position': ''
  }).addClass('endless-loading').ancestor().setStyle('text-align', 'center');
  YloadingIcon.one('div.image-block-wrapper').setStyle('padding-bottom', 0);
  Y.one(parent).append(YloadingIcon);
  
  YnewItemToClone = YparentToAppend.one('.summary-item-list .summary-item').cloneNode(true);
  YnewItemToClone.addClass('cloned').hide();
  YparentToAppend.append(YnewItemToClone);
  YnewItemToClone.one('img')
    .set('src', '')
    .setAttribute('data-src', '')
    .removeClass('positioned');

  Y.one(parent).setStyles({
    'background-color': '#e8edf3',
    'padding': '2em'
  });

  Y.one(parent).simulate('resize');
  YparentToAppend.one('.summary-item-list').setStyle('display', 'block'); // with style, prevented summary to appear

  Y.on('resize', function()
  {
    currentWidth = Y.one('.summary-item-list .summary-item img').get('width');
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
      YloadingIcon.one('img').hide();

      if (layoutComplete) return;

      if (createPageComplete)
      {
        YparentToAppend.one('.summary-item-list').all('.summary-item').removeClass('invisible');
        YloadingIcon.remove(true);
        var position = initialScrollPosition;
        var YpostPage = Y.one(post+'#'+pageId);
        if ( YpostPage )
        {
          position = YpostPage.getY();
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
    stuffBottom = Y.one(parentChild).get('clientHeight') + Y.one(parentChild).getY();
    
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
        var Yimg = YloadingIcon.one('img:not(.fixed)');
        if (Yimg) Yimg.addClass('fixed');
      }
      else
      {
        var Yimg = YloadingIcon.one('img.fixed');
        if (Yimg) Yimg.removeClass('fixed');
      }
    }
  }

  function createLayout ()
  {
    if (jsonCachedRequest === null || createPageComplete) return false;

    YloadingIcon.one('img').show();

    var json = jsonCachedRequest;

    for (var i = itemsLoaded; i < totalItemsCount; i++)
    {
      var YnewItem = YnewItemToClone.cloneNode(true).show();

      var itemPageId = json.items[i].fullUrl.split('/').pop();
      YnewItem
        .setAttribute('id', itemPageId)
        .addClass('invisible')
        .removeClass('cloned');

      setMouseHover(YnewItem);
      YparentToAppend.one('.summary-item-list').append(YnewItem);

      var imgSize = json.items[i].originalSize;
      var imgHeight = imgSize.split('x')[1];
      var imgRatio = imgSize.split('x')[0] / imgHeight;
      imgHeight = parseInt(currentWidth / imgRatio, 10);
      YnewItem.one('img')
        .setAttribute('style', 'height:'+ imgHeight + 'px !important')
        .setStyle('opacity', 1)
        .addClass('lazyload')
        .setAttribute('data-image-dimensions', '')
        .setAttribute('data-image', json.items[i].assetUrl)
        .setAttribute('alt', '')
        .setAttribute('data-src', json.items[i].assetUrl +'?format='+ thumbSize +'w')
        .setAttribute('data-srcset',
          json.items[i].assetUrl +'?format=100w 100w'
          +','+ json.items[i].assetUrl +'?format=300w 300w'
          +','+ json.items[i].assetUrl +'?format=500w 500w'
        )
        //.getDOMNode().src = json.items[i].assetUrl +'?format=100w'
        .on('load', function()
        {
          this.setStyle('height', '');
        })
      ;

      YnewItem.one('a')
        .set('href', json.items[i].fullUrl)
        .setAttribute('click-href', initialLocation + '#p@' + itemPageId)
        .on('click', function() {
          history.replaceState({},'', this.getAttribute('click-href'));
        });

      YnewItem.one('.product-price span').setContent(
        (json.items[i].variants[0].price / 100).toFixed(2)
      );
    }

    Y.one('footer#footer').show();
    createPageComplete = true;

    return true;
  } // function createLayout

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

  function setMouseHover (Ynode)
  {
    Ynode.all('.summary-item img').on('mouseenter', function(e)
    {
      e.currentTarget.transition(
        {
          duration:0.5,
          opacity:0.5
        });
    });
    Ynode.all('.summary-item img').on('mouseleave', function(e)
    {
      e.currentTarget.transition(
        {
          duration:0.5,
          opacity:1
        });
    });
  } // function setMouseHover
} // function endlessScrolling