var db = wx.cloud.database();
const app = getApp()


class Recommend {
  static get(card, latitudeShared, longitudeShared, cb) {
    var latitude = latitudeShared > 0 ? latitudeShared : app.globalData.latitude;
    var longitude = longitudeShared > 0 ? longitudeShared : app.globalData.longitude;
    console.log("Recommend.get: ");
    console.log(longitude);
    console.log(latitude);
    var cards = []
    var tags = !!card.tags ? card.tags:[];
    //1、同标签下
    var cond = {
      location: _.geoNear({
        geometry: db.Geo.Point(parseFloat(longitude), parseFloat(latitude)),
        minDistance: 0,
        maxDistance: page.globalData.distance || 15000,
      }),
      status: 1
    };
    
    cond.tags =  _.in(tags)
    db.collection('attractions').orderBy('priority', 'desc').orderBy('sort_time', 'desc').where(cond).limit(4).get({
      success: res => {
        console.log("cards.1: ");
        console.log(res.data);
        for (var i=0; i<res.data.length; i++) {
          res.data[i].address = res.data[i].address.replace("广东省", "").replace("广州市", "").replace("番禺区", "");
        }
        cards = res.data
        
        //2、非同标签下
        
        cond.tags =  _.nin(tags)
        db.collection('attractions').orderBy('priority', 'desc').orderBy('sort_time', 'desc').where(cond).limit(4).get({
          success: res => {
            console.log("cards.2: ");
            console.log(res.data);
            for (var i=0; i<res.data.length; i++) {
              res.data[i].address = res.data[i].address.replace("广东省", "").replace("广州市", "").replace("番禺区", "");
            }
            cards = cards.concat(res.data)
            
            //返回渲染
            cb(cards);
            
          },
          fail: err => {
            console.log(err);
          }
        })
        
      },
      fail: err => {
        console.log(err);
      }
    })
  };
  
  static track(cardId) {
    db.collection('comment').add({
      data: {
        card_id: cardId,
        content: content,
        status: 2,
        reason: "",
        create_time: formatDate(new Date().getTime())
      }
    }).then(res => {
      console.log(res)
    }).catch(console.error) 
  };
  
}
module.exports = Recommend;
