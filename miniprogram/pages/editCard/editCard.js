// miniprogram/pages/editCard/editCard.js
let wechat = require("../../utils/wechat");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cardId: 0,
    address: "123",
    latitude: 0,
    longitude: 0,
    imgUrl: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var page = this;
    wx.getLocation({
      //type: 'gcj02',
      success(res) {
        const latitude = res.latitude
        const longitude = res.longitude
        const speed = res.speed
        const accuracy = res.accuracy
        page.onUpdateLocation(latitude, longitude);
      }
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
      page.setData({ address: value.data.result.address_component.street_number });
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

        for (var i = 0; i < res.tempFilePaths.length; i++) {
          wx.cloud.uploadFile({
            cloudPath: timestamp+'.'+i+'.png',
            filePath: res.tempFilePaths[i], // 文件路径
          }).then(res => {
            // get resource ID
            console.log("img uploaded.")
            console.log(res)
            page.setData({ imgUrl: res.fileID });
          }).catch(error => {
            // handle error
            console.log(error)
          })
        }
      }
    })
  },

  choosePos: function () {
    var page = this;
    wx.chooseLocation({
      success: function (res) {
        console.log(res);
        page.setData({ address: res.address });
        //page.onUpdateLocation(res.latitude, res.longitude);
      },
    })
  }

})