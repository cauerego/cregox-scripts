<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>

<script made-for="limiting checkout">
  // if this list is empty, it will limit checkout for minTotal on the whole subtotal
  // values must be the precise HREF under the item on checkout
  var preSelectedItems = ['/shop/fourty-two', '/shop/ninety-one'];
  
  // if minTotal is 0 or less, there will be no warning
  var minTotal = '200.00';
  
  // customize the message at your will
  var warningMessage = 'For the selected items, you need to add a subtotal of at least $'+ minTotal +' and you only got $%total%';
  
  // code
  $(document).ready(function(){
    var checkout = $('div.checkout .checkout-button');
    checkout.css({'display': 'none'});
    $('<div class="checkout-button">Checkout</div>')
     .appendTo(checkout.parent()).click(function(){
      var total = 0;
      if (preSelectedItems && preSelectedItems.length > 0) {
        $.each(preSelectedItems, function(index, value){
          var addToTotal = $('div.cart-container .item-desc a[href="'+value+'"]').parents('tr').find('span.sqs-money-native').text();
          if ( addToTotal && !isNaN(parseFloat(addToTotal)) && isFinite(addToTotal) ) {
            total += parseFloat(addToTotal);
          }
        });
      } else {
        total = parseFloat($('div.subtotal span.sqs-money-native').text());
      }
      if (total > parseFloat(minTotal)) {
        checkout.trigger('click');
      } else {
        var warning = $('<div class="sqs-widgets-confirmation-content clear"><div class="title">Unable to Checkout</div><div class="message">'+ warningMessage.replace('%total%', total.toFixed(2)) +'</div><div class="buttons"><div class="confirmation-button no-frame confirm" tabindex="3">Okay</div></div></div>').appendTo(checkout.parent().parent());
        warning.css({'position':'absolute','right':'0px','width':'300px'});
        warning.ready(function(){
          warning.fadeIn('slow');
        });
        warning.find('.confirm').click(function(){
          warning.fadeOut('slow', function(){
            warning.remove();
          });
        });
      }
    });
  });
</script>