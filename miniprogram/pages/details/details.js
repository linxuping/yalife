// miniprogram/pages/details/details.js
var db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    cardId: 0,
    card: undefined
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var page = this;
    if (options.id != undefined) {
      page.setData({
        cardId: options.id
      });
      const _ = db.command
      db.collection('attractions').where({
        _id: options.id
      }).get({
        success: res => {
          console.log("details: ");
          console.log(res.data);
          if (res.data.length > 0) {
            let card = res.data[0]
            page.setData({
              card: card
            });
          }
        },
        fail: err => {
          console.log(err);
        }
      }) 
    }
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

  }
})