// miniprogram/pages/editCard/editCard.js
let wechat = require("../../utils/wechat");
var db = wx.cloud.database();
const app = getApp()

function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return year+"-"+month+"-"+day+" "+hour+":"+minute+":"+second
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    card: undefined,
    cardId: 0,
    address: "",
    latitude: 0,
    longitude: 0,
    imgurl: "",
    content: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var page = this;
    wx.setNavigationBarTitle({
      title: '新建条目发布'
    })

    console.log(options);
    console.log(options.id);

    if (options.id != undefined) {
      page.setData({
        cardId: options.id
      });

      const _ = db.command
      db.collection('attractions').where({
        _id: options.id
      }).get({
        success: res => {
          console.log("edit card: ");
          console.log(res.data);
          if (res.data.length > 0) {
            let card = res.data[0]
            page.setData({
              card: card,
              cardId: card._id,
              address: card.address,
              latitude: card.latitude,
              longitude: card.longitude,
              imgurl: card.imgurl,
              content: card.content
            })

            if (card.address == "") {
              wx.getLocation({
                type: 'gcj02',
                success(res) {
                  const latitude = res.latitude
                  const longitude = res.longitude
                  const speed = res.speed
                  const accuracy = res.accuracy
                  page.onUpdateLocation(latitude, longitude);
                }
              })
            }

          }
        },
        fail: err => {
          console.log(err);
        }
      })      
    } else {
      console.log("get location:");
      if (app.globalData.address) {
        page.setData({ 
          address: app.globalData.address,
          latitude: app.globalData.latitude,
          longitude: app.globalData.longitude
        });
      } else {
        wx.getLocation({
          type: 'gcj02',
          success: function(res) {
            console.log(res);
            page.onUpdateLocation(res.latitude, res.longitude);
          },
          fail: function (res) {
            console.log(res); //{errMsg: "getLocation:fail auth deny"} 不授权的结果
          }
        })      
      }
    }

    wx.hideShareMenu({
    })
  },

  onUpdateLocation: function (latitude, longitude) {
    var page = this;
    let url = `https://apis.map.qq.com/ws/geocoder/v1/`;
    let key = 'V3WBZ-LO4WK-FEYJS-AXWMR-YT5YO-A3FXR';
    let params = {
      location: latitude + "," + longitude,
      key
    }
    wechat.request(url, params).then(function (value) {
      console.log(`fulfilled: ${value}`);
      console.log(value);
      /*wx.showToast({
        title: value.data.result.address_component.street_number,
      })*/
      page.setData({ 
        address: value.data.result.address_component.street_number,
        latitude: latitude,
        longitude: longitude
      });
    })
    .catch(function (value) {
      console.log(`rejected: ${value}`); // 'rejected: Hello World'
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  chooseImage: function () {
    var page = this;
    wx.chooseImage({
      count: 1, // 默认9 
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有 
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有 
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片 
        page.setData({
          tempFilePaths: res.tempFilePaths
        })
        console.log(res.tempFilePaths);
        console.log(res.tempFilePaths.length);

        var timestamp = Date.parse(new Date());
        timestamp = timestamp / 1000;  
        wx.showLoading({
          title: '文件上传中...',
        })
        for (var i = 0; i < res.tempFilePaths.length; i++) {
          wx.cloud.uploadFile({
            cloudPath: timestamp+'.'+i+'.png',
            filePath: res.tempFilePaths[i], // 文件路径
          }).then(res => {
            // get resource ID
            console.log("img uploaded.")
            console.log(res)
            page.setData({ imgurl: res.fileID });
            wx.hideLoading()
          }).catch(error => {
            // handle error
            console.log(error)
            wx.hideLoading()
          })
        }
      }
    })
  },

  choosePos: function () {
    console.log("choose pos");
    var page = this;
    wx.chooseLocation({
      success: function (res) {
        console.log(res);
        page.setData({ 
          address: res.address,
          latitude: res.latitude, 
          longitude: res.longitude
        });
        //page.onUpdateLocation(res.latitude, res.longitude);
      },
    })
  },

  updateCard: function (event) {
    var page = this;
    var opType = event.currentTarget.dataset.type;

    if (event.detail.formId != 'the formId is a mock one') {

    }
    console.log("formid: ");
    console.log(event.detail.formId);
    /*wx.showToast({
      title: event.detail.formId
    })
    wx.setClipboardData({
      data: event.detail.formId,
      success() {
        wx.hideToast();   
      }
    })*/
    app.saveFormid(event.detail.formId);
    

    if (page.data.content == "") {
      wx.showToast({
        title: '发布内容为空！',
        icon: 'none',
        duration: 2000
      })
      return
    }

    var cardData = {
      title: page.data.title,
      address: page.data.address,
      latitude: page.data.latitude,
      longitude: page.data.longitude,
      imgurl: page.data.imgurl,
      content: page.data.content,
      update_time: new Date //formatTime(new Date)
    };
    if (page.data.latitude && page.data.longitude) {
      cardData["location"] = db.Geo.Point(page.data.longitude, page.data.latitude)
    }
    console.log("update card." + page.data.cardId);

    if (opType == "add" && page.data.cardId == 0) {
      console.log("add.")
      //add
      cardData["create_time"] = formatTime(new Date)
      cardData["status"] = 2
      cardData["visit_count"] = 1
      cardData["type"] = "邻里"
      cardData["reason"] = ""
      cardData["tags"] = [ "邻里" ]
      wx.showLoading({
        title: '正在新建...'
      })
      db.collection('attractions').add({
        // data 字段表示需新增的 JSON 数据
        data: cardData,
        success: function (res) {
          // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
          page.setData({
            cardId: res._id
          });
          wx.showToast({
            title: '新增成功',
          })
          wx.redirectTo({
            url: '/pages/homepage/homepage',
          })
          wx.hideLoading();
        },
        fail: function (res) {
          console.log(res);
          wx.showToast({
            title: '新增失败',
          })
          wx.hideLoading();
        }
      })
    } 
    console.log(opType);
    console.log(page.data.cardId);
    if (opType == "update" && page.data.cardId.length>0){
      cardData.status = page.data.card.status,
      //update
      wx.showLoading({
        title: '正在更新...'
      })
      console.log(123456);
      db.collection('attractions').doc(this.data.cardId).update({
        data: cardData,
        success: function (res) {
          wx.showToast({
            title: '更新成功',
          })
          wx.redirectTo({
            url: '/pages/homepage/homepage',
          })
          wx.hideLoading();
        },
        fail: function (res) {
          console.log(res);
          wx.showToast({
            title: '更新失败',
          })
          wx.hideLoading();
        }
      });
    }
  },

  onInput: function (e) {
    console.log("on input");
    this.setData({
      content: e.detail.value
    })
  },

  goBack: function () {
    wx.navigateBack({
      fail: function(){
        wx.redirectTo({
          url: '/pages/index/index',
        })
      }
    });
  }

})



