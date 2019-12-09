var db = wx.cloud.database();
const app = getApp()
const _ = db.command

class Recommend {
  static get(card, latitudeShared, longitudeShared, cb) {
    var latitude = latitudeShared > 0 ? latitudeShared : app.globalData.latitude;
    var longitude = longitudeShared > 0 ? longitudeShared : app.globalData.longitude;
    console.log("Recommend.get: ");
    console.log(longitude);
    console.log(latitude);
    var cards = [];
    var tags = (!!card.tags)? card.tags:[];
    //1、同标签下
    var cond = {
      location: _.geoNear({
        geometry: db.Geo.Point(parseFloat(longitude), parseFloat(latitude)),
        minDistance: 0,
        maxDistance: app.globalData.distance || 15000,
      }),
      status: 1
    };
    console.log("before user track get:");
    console.log(app.globalData.openid);
    db.collection('user_track').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        console.log("user_track get: ")
        console.log(res.data);
        var cardIds = [];
        var hasTrack = res.data.length > 0;
        var trackId = "";
        if (hasTrack) {
          cardIds = res.data[0].cardids || [];
          trackId = res.data[0]._id;
        }
        if (cardIds.indexOf(card._id) == -1) {
          cardIds.push(card._id);
        }
          
        //cond._id = _.nin(cardIds) //没有阅读过的卡片
        //cond.tags =  _.in(tags)   //当前相关的标签
        cond.seek_type = 1 //寻找
        db.collection('attractions').orderBy('sort_time', 'desc').where(cond).limit(4).get({
          success: res => {
            console.log("cards.1: ");
            console.log(res.data);
            for (var i=0; i<res.data.length; i++) {
              res.data[i].address = res.data[i].address.replace("广东省", "").replace("广州市", "").replace("番禺区", "");
            }
            cards = res.data
            cb(cards); //第一批更新

            //2、非同标签下

            //cond.tags =  _.nin(tags)  //除了当前的其他标签
            delete cond.seek_type //排除寻找
            cond._id = _.nin(cardIds) //没有阅读过的卡片
            cond.tags =  _.in(tags)   //当前相关的标签
            db.collection('attractions').orderBy('priority', 'desc').orderBy('sort_time', 'desc').where(cond).limit(4).get({
              success: res => {
                console.log("cards.2: ");
                console.log(res.data);
                for (var i=0; i<res.data.length; i++) {
                  res.data[i].address = res.data[i].address.replace("广东省", "").replace("广州市", "").replace("番禺区", "");
                }
                cards = cards.concat(res.data)

                //返回渲染
                cb(cards); //全部更新
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
        
        //更新track cardids
        var len = cardIds.length;
        console.log("recommend.len: ");
        console.log(len);
        if (len > 200) {
          cardIds = cardIds.slice(1,len);
        }
        if (!hasTrack) {
          console.log("add user_track");
          db.collection('user_track').add({
            data: {
              cardids: cardIds //待优化性能
            }
          });
        } else {
          //?
          console.log("update user_track");
          console.log(app.globalData.openid);
          console.log(card._id);
          console.log(cardIds);
          db.collection('user_track').doc(trackId).update({
            data: {
              cardids: cardIds //待优化性能
            },
            success: res => {
              console.log("update ok.");
            },
            fail: err => {
              console.error('[数据库] [更新记录] 失败：', err)
            }
          });         
        }
      }, fail: res => {
        console.log(res);
      }
    }) 
  };
  
  static track(cardId) {
    db.collection('user_track').where({
      _openid: app.globalData.openid
    }).get({
      success: res => {
        console.log(res.data);
        if (res.data.length > 0) {
          var cardIds = res.data[0].cardids || []
          cardIds.push(cardId);
          var len = cardIds.length;
          console.log(len);
          if (len > 200) {
            cardIds = cardIds.slice(1,len);
          }

          db.collection('user_track').where({
            _openid: app.globalData.openid
          }).update({
            data: {
              cardids: cardIds //待优化性能
            }
          });          
        }
      },
      fail: err => {
        console.log(err);
      }
    })
  };
}
module.exports = Recommend;
