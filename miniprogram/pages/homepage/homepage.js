// miniprogram/pages/homepage/homepage.js
var db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    cardList: [],
    openid: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var page = this;
    wx.cloud.callFunction({
      name: 'login',
      complete: res => {
        console.log("login:")
        console.log(res);
        page.setData({
          openid: res.result.openid
        });
        page.onShow()
      }
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
    var page = this;
    /*page.setData({
      cardList:[
        {
          id: 1,
          url: "https://ss0.baidu.com/73x1bjeh1BF3odCf/it/u=1334376082,413698594&fm=85"
        }
      ]
    })*/
    console.log(page.data);
    const _ = db.command
    db.collection('attractions').orderBy('create_time', 'desc').where({
      status: _.gt(0),
      _openid: page.data.openid
    }).get({
      success: res => {
        console.log("geo result: ");
        console.log(res.data);
        page.setData({
          cardList: res.data
        })
      },
      fail: err => {
        console.log(err);
      }
    })
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

  onDeleteCard: function (event) {
    var page = this;
    console.log(event);
    var cardId = event.currentTarget.dataset.cardid;
    console.log(cardId);
    console.log(page.data.openid)
    wx.showModal({
      title: '提示',
      content: '确定要删除吗？',
      success: function (sm) {
        if (sm.confirm) {
          // 用户点击了确定 可以调用删除方法了
          db.collection('attractions').doc(cardId).update({
            data: {
              status: 0
            },
            success: function (res) {
              wx.showToast({
                title: '删除成功',
              })
              page.onShow()
            },
            fail: function (res) {
              console.log(res);
              wx.showToast({
                title: '删除失败',
              })
            }
          });
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  }
})