//index.js
const app = getApp()
let wechat = require("../../utils/wechat");
var common = require("../../utils/common.js")
var types = [];
//var types_titles = {};
var pages = 0;
var db = wx.cloud.database();
const _ = db.command
var startSize = 15000 //15KM

function sort(arr){
  var d=new Date();
  //return arr.sort(function () { return d.getHours()/25 - Math.random() });
  return arr.sort(function () { return 0.5 - Math.random() });
}

function getDateDiff(dateStr) {
  var dateTimeStamp = Date.parse(dateStr.replace(/-/gi, "/"));
  var minute = 1000 * 60;
  var hour = minute * 60;
  var day = hour * 24;
  var halfamonth = day * 15;
  var month = day * 30;
  var now = new Date().getTime();
  var diffValue = now - dateTimeStamp;
  if (diffValue < 0) { return; }
  var monthC = diffValue / month;
  var weekC = diffValue / (7 * day);
  var dayC = diffValue / day;
  var hourC = diffValue / hour;
  var minC = diffValue / minute;
  var result = ""; //不加会异常？？？
  if (monthC >= 1) {
    result = "" + parseInt(monthC) + "月前";
  }
  else if (weekC >= 1) {
    result = "" + parseInt(weekC).toString() + "周前";
  }
  else if (dayC >= 1) {
    result = "" + parseInt(dayC) + "天前";
  }
  else if (hourC >= 1) {
    result = "" + parseInt(hourC) + "小时前";
  }
  else if (minC >= 1) {
    result = "" + parseInt(minC) + "分钟前";
  } else{
    result = "刚刚";
  }
  return result;
}

function yesterday(num, str) {
  var today = new Date();
  var nowTime = today.getTime();
  var ms = 24 * 3600 * 1000 * num;
  today.setTime(parseInt(nowTime + ms));
  var oYear = today.getFullYear();
  var oMoth = (today.getMonth() + 1).toString();
  if (oMoth.length <= 1) oMoth = '0' + oMoth;
  var oDay = today.getDate().toString();
  if (oDay.length <= 1) oDay = '0' + oDay;
  //return oYear + str + oMoth + str + oDay;
  return oMoth + "月" + oDay + "日";
}

function formatDate(time) {
  var date = new Date(time);
  var year = date.getFullYear(),
    month = date.getMonth() + 1,//月份是从0开始的
    day = date.getDate(),
    hour = date.getHours(),
    min = date.getMinutes(),
    sec = date.getSeconds();
  var newTime = year + '-' +
    (month < 10 ? '0' + month : month) + '-' +
    (day < 10 ? '0' + day : day) + ' ' +
    (hour < 10 ? '0' + hour : hour) + ':' +
    (min < 10 ? '0' + min : min) + ':' +
    (sec < 10 ? '0' + sec : sec);
  return newTime;
}

function goods_distinct(goods){
  var goods_names = [];
  var result = []
  for (var i=0; i<goods.length; i++){
    if (goods_names.indexOf(goods[i]._id) == -1){
      result.push(goods[i]);
      goods_names.push(goods[i]._id);
      continue
    }
    console.log(goods[i]._id);
  }
  return result;
}

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    goods: [ ],
    goodsIndex: [],
    types: [], //'衣服', '鞋子'
    //types_titles: {},
    showTypes: false,
    showGoods: true,
    typeClicked: false,
    keyword: "",
    curTab: 0,
    current: 0,
    tabList: [{
      id: 1,
      name: "儿童"
    },
    {
      id: 2,
      name: "女性"
    },
    {
      id: 3,
      name: "衣饰"
    }, 
    {
      id: 4,
      name: "吃货"
    },
    {
      id: 5,
      name: "电器"
    },
    {
      id: 6,
      name: "其他"
    }
    ],
    types_class: [],
    address: "",
    distance: app.globalData.distance, //15000,
    distanceDesc: "15km内",
    typeImgHeight: 0,
    typeImgHeight2: 0,
    type: "",
    tags: [],
    index: 2, //15km
    array: ['3km', '8km', '15km'],
  },

  selectTab(e) {
    let index = e.target.dataset.index;
    console.log(index);
    this.setData({
      curTab: index,
      current: index
    })
  },
  swiperChange(e) {
    let index = e.detail.current;
    this.setData({
      curTab: index,
      current: index
    })
  },
  bindPickerChange: function (e) {
    var page = this;
    console.log('picker发送选择改变，携带值为', e.detail.value);//index为数组点击确定后选择的item索引
    var distance = 15000;
    if (e.detail.value == 0) {
      distance = 3000;
    } else if(e.detail.value == 1) {
      distance = 8000;
    }
    page.setData({
      index: e.detail.value,
      distance: distance
    })
    app.addEventLog("choose distance", distance);
    page.getTags(true);
  },
  onLoadCards: function (openid, latitude, longitude, dfrom, dto, firstPage) {
    if (openid == "") {
      console.log("no openid");
      return
    }
    var page = this;
    //console.log(page.data);
    const db = wx.cloud.database()
    if (dto == 0) {
      dto = 100000000;
    }
    var cond = {
      location: _.geoNear({
        geometry: db.Geo.Point(longitude, latitude),
        minDistance: dfrom,
        maxDistance: dto,
      })
    };
    if (page.data.type && page.data.type.length > 0) {
      cond.tags = page.data.type;
    }
    cond.status = 1
    var query = db.collection('attractions').where(cond).orderBy("sort_time", "desc");
    if (firstPage) {
      wx.showLoading({
        title: '正在加载...',
      })
      query = query.limit(200)
    } else {
      query = query.skip(200)
    }
    query.get({
      success: res => {
        console.log("geo result: ");
        console.log(res.data);
        var cardIds = [];
        for (var i=0; i<res.data.length; i++) {
          if (res.data[i].address) {
            res.data[i].address = res.data[i].address.replace("广东省", "").replace("广州市", "").replace("番禺区", "");
            //console.log(res.data[i].update_time.toString());
            if (res.data[i].update_time.toString().indexOf("-") > 0) {
              //console.log(res.data[i].update_time);
              res.data[i].create_time = getDateDiff(res.data[i].update_time);
            } else {
              res.data[i].create_time = getDateDiff(res.data[i].create_time);
            }
          }
          cardIds.push(res.data[i]._id);
          /*db.collection('attractions').doc(res.data[i]._id).update({
            // data 传入需要局部更新的数据
            data: {
              visit_count: _.inc(parseInt(Math.random()*10)%2+1)
            },
            success: console.log,
            fail: console.error
          })*/
        }
        if (cardIds.length > 0) {
          wx.cloud.callFunction({
            name: 'visit_count',
            data: {
              cardIds: cardIds
            },
            success: res => {
              console.log("add visit_count succ");
            },
            fail: err => {
              console.log(err);
            }
          })
        }
        page.setData({ goods: page.data.goods.concat(goods_distinct(res.data)) });
        wx.hideLoading();
        if (res.data.length==0 && firstPage) {
          wx.showModal({
            title: '附近未有发布条目😊',
            content: '',
            cancelText: '暂不谢谢',
            confirmText: '我来发布',
            success(res) {
              if (res.cancel) {
              } else if (res.confirm) {
                app.addEventLog("into index.add.hint");
                wx.navigateTo({
                  url: '/pages/editCard/editCard',
                })
              }
            }
          })
        } else if (firstPage) {
          //是否为第一页，继续加载其他
          //page.onLoadCards(openid, latitude, longitude, dfrom, dto, false);
        }
      },
      fail: err => {
        console.log(err);
        wx.hideLoading();
      }
    });
    page.getTags();
  },

  onLoad: function() {
    var page = this;
    //app.getPermission(page);

    this.setData({
      types_class: types_class
    });

    var page = this;
    if (!wx.cloud) {
      wx.navigateTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    
    wx.getSystemInfo({
      success: function (res) {
        page.setData({
          typeImgHeight: res.windowWidth/6,
          typeImgHeight2: res.windowWidth/2*3/4
        }); 
      }
    });

    /*
    const $ = db.command.aggregate
    var ret = db.collection('attractions').aggregate()
      .geoNear({
        distanceField: 'distance', // 输出的每个记录中 distance 即是与给定点的距离
        spherical: true,
        near: db.Geo.Point(113.3089506, 23.0968251),
        query: {
          docType: 'geoNear',
        },
        key: 'location', // 若只有 location 一个地理位置索引的字段，则不需填
        includeLocs: 'location', // 若只有 location 一个是地理位置，则不需填
      })
      .end()
    */

    const _ = db.command

    //wx.getLocation({
    //  type: 'gcj02',
    app.getLocation(
      function(res) {
        const latitude = res.latitude
        const longitude = res.longitude
        const speed = res.speed
        const accuracy = res.accuracy
        page.setData({
          latitude: res.latitude,
          longitude: res.longitude      
        });
        
        app.globalData.latitude = latitude;
        app.globalData.longitude = longitude;

        wx.cloud.callFunction({
          name: 'login',
          complete: res => {
            //console.log(res);
            console.log('云函数获取到的openid: ', res.result.openid);
            app.globalData.openid = res.result.openid
            page.onLoadCards(app.globalData.openid, latitude, longitude, 0, startSize, true);
          }
        });

        //page.onLoadCards(page.data.openid, latitude, longitude, 0, startSize)
        
        let url = `https://apis.map.qq.com/ws/geocoder/v1/`;
        let key = 'V3WBZ-LO4WK-FEYJS-AXWMR-YT5YO-A3FXR';
        let params = {
          location: latitude + "," + longitude,
          key
        }

        wechat.request(url, params).then(function (value) {
            //console.log(`fulfilled: ${value}`);
            console.log(value.data.result);
            app.globalData.address = value.data.result.address_component.street_number;
          page.setData({ address: app.globalData.address});
          })
          .catch(function (value) {
            console.log(`rejected: ${value}`); // 'rejected: Hello World'
            console.log(data)
          });
      }
    );
  },
  choosePos: function () {
    console.log("choose pos");
    var page = this;
    //wx.chooseLocation({
    //  success: 
    app.chooseLocation(function (res) {
        console.log(res);
        var address = ""
        if (res.address) {
          address = res.address.replace("广东省", "").replace("广州市", "").replace("番禺区", "")
        }
        page.setData({ 
          address: address,
          latitude: res.latitude, 
          longitude: res.longitude
        });
        app.addEventLog("choose pos", address);
        page.getTags(true);
        app.globalData.latitude = res.latitude;
        app.globalData.longitude = res.longitude;
        app.globalData.address = address;
        /*wx.showToast({
          title: '修改成功！',
        })*/
      }
    )
  },
  getTags: function(showLoading) {
    var page = this;
    if (showLoading) {
      wx.showLoading({
        title: '正在分析最近的分享信息...',
      })
    }
    //console.log("this.data: ");
    //console.log(page.data);
    var cond = {
      location: _.geoNear({
        geometry: db.Geo.Point(page.data.longitude, page.data.latitude),
        minDistance: 0,
        maxDistance: parseInt(page.data.distance),
      }),
      status: _.gte(0)
    };
    db.collection('attractions').where(cond).get({
      success: res => {
        console.log("get tags: ");
        console.log(res.data);
        var dic = {};
        for (var i=0; i<res.data.length; i++) {
          //console.log("item.tags: ");
          //console.log(res.data[i].tags);
          var tmpTags = res.data[i].tags;
          if (tmpTags==undefined || tmpTags.length==0) {
            continue
          }
          for (var j=0; j<tmpTags.length; j++) {
            var tag = tmpTags[j];
            if (dic[tag] == undefined) {
              dic[tag] = 1
            } else {
              dic[tag] = dic[tag] + 1
            }
          }
        }
        //console.log("dic: ");
        //console.log(dic);
        var res2 = Object.keys(dic).sort(function(a,b){ return dic[b]-dic[a]; });
        var tags = [];
        for(var key in res2){
          //console.log(">>> key: " + res2[key] + " ,value: " + dic[res2[key]]);
          tags.push(res2[key])
        }
        if (tags.length > 0) {
          tags.push("全部");         
        } else {
          wx.showToast({
            title: '未搜到分享信息...',
          })
        }
        page.setData({ tags: tags }); 
        wx.hideLoading();
      },
      fail: err => {
        console.log(err);
        wx.hideLoading();
      }
    })
  },
  clickSearch: function (e) {
    wx.pageScrollTo({
      scrollTop: 0
    })
    this.setData({showTypes:true, showGoods:false});
  },
  clickType: function (e) {
    var type = parseInt(event.currentTarget.dataset.type);
    this.setData({ type: type });
  },
  updateKeyword: function(e){
    var val = e.detail.value;
    this.setData({
      keyword: val
    });
  },
  tbSearch: function (e) {
    pages = 0;
    var page = this;
    //page.setData({ goods: [] });
    wx.pageScrollTo({
      scrollTop: 0
    })
    this.setData({ showTypes: false, showGoods: true });
    //const db = wx.cloud.database();
    console.log("----titles--->");

    if (openid != "oV5MQ5aN_i_ea9dGxZOHHBC8Bosg"){
      db.collection('search_keywords').add({
        // data 字段表示需新增的 JSON 数据
        data: {
          keyword: page.data.keyword,
          type: 'tb search',
          create_time: formatDate(new Date().getTime())
        }
      }).then(res => {
        console.log(res)
      })
        .catch(console.error)      
    }

    console.log(types_titles);
    if (page.data.keyword.trim().length==0){
      db.collection('goods').orderBy('quanter', 'desc').limit(10).get({
        success: res => {
          page.setData({ goods: res.data });
        },
        fail: err => {
          console.log(err);
        }
      });
      return;
    }
    page.setData({
      goods: []
    });
    wx.showLoading({
      title: '查询中....',
    })
    setTimeout(function(){
      wx.hideLoading();
    },5000);
    var hit = false;
    var all_types = this.data.types;
    all_types.push('预留1');
    var _len = all_types.length;
    console.log(all_types);
    console.log(types_titles);
    for (var i=0; i<_len; i++){
      let _type = all_types[i];
      let _value = types_titles[_type];
      let goods = [];
      if (_value == undefined){
        //page.tbSearch(e);
        console.log("undefi: "+_type);
        continue;
      }
        
      if (_value.indexOf(page.data.keyword) >= 0){
        hit = true;
        console.log('search hit....'+page.data.keyword);
        function query_goods(offset){
          var query = null;
          if (offset == 0)
            query = db.collection('goods').orderBy('quanter', 'desc');
          else
            query = db.collection('goods').orderBy('quanter', 'desc').skip(offset)
          query.where(
            { type: _type }
          ).get({
            success: res => {
              //console.log(res.data);
              for (var j=0; j<res.data.length; j++){
                if (res.data[j].title.indexOf(page.data.keyword) >= 0){
                  console.log('hithit');
                  goods.push(res.data[j]);
                }
              }
              page.setData({
                goods: page.data.goods.concat( goods_distinct(goods) )
              });
              console.log(_type + ": " + offset.toString() + "->" + res.data.length.toString());
              if (res.data.length == 20){
                if (page.data.goods.length >= 150){
                  console.log(_type + " excceed!");
                }
                else
                  setTimeout(function(){
                    query_goods(offset + 20);
                  },1000);
              }
              else{
                wx.hideLoading();
              }
            },
            fail: err => { console.log(err); }
          }); 
        }
        query_goods(0)
      }
    }
    if (!hit){
      wx.hideLoading();
      wx.showToast({
        title: '尝试其他词哈～',
      })
    }
  },
  typeSearch: function(event){
    var page = this;
    var distance = page.data.distance;
    if (event.currentTarget.dataset.distance) {
      distance = event.currentTarget.dataset.distance;
    }
    console.log(distance);
    app.addEventLog("type search", event.currentTarget.dataset.type, distance);
    var type = event.currentTarget.dataset.type;
    if (type == "全部" || type==undefined) {
      type = ""
    }
    var distanceDesc = ""
    if (distance==undefined || distance.length==0 || distance==0) {
      distance = 0;
    } else {
      distanceDesc = distance/1000 + "km内"
      app.globalData.distance = distance;
    }
    var page = this;
    page.setData({ showTypes: false, showGoods: true, typeClicked: true, goods: [], keyword: "", distanceDesc: distanceDesc, distance: distance,  type: type  });
    page.onLoadCards(app.globalData.openid, page.data.latitude, page.data.longitude, 0, parseInt(distance), true);
  },
  onReachBottom: function(){
    return;
    if (pages == -1)
      return;
    this.setData({ typeClicked:false });
    var page = this;
    if (page.data.keyword.trim().length > 0 || page.data.showTypes)
      return;
    //const db = wx.cloud.database();
    pages += 10;
    console.log("offset: "+pages);
    wx.showLoading({
      title: '加载中！稍等哈',
    })
    /*db.collection('goods').orderBy('quanter', 'desc').skip(pages).limit(10).get({
      success: res => {
        page.setData({ goods: page.data.goods.concat( goods_distinct(res.data) )  });
        wx.hideLoading();
      },
      fail: err => {
        console.log(err);
        wx.hideLoading();
      }
    });*/
    page.onLoadCards(app.globalData.openid, page.data.latitude, page.data.longitude, 0, 5000+pages*1000, true)
    wx.hideLoading();
  },
  update_goods_index: function(e) {
    
