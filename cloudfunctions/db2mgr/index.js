// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database();
  db.collection('goods').doc('5bcf3cab4fd3484a16bf5ce1').remove({
    success: res => {
      wx.showToast({
        title: '删除成功',
      })
    },
    fail: err => {
      wx.showToast({
        icon: 'none',
        title: '删除失败',
      })
      console.error('[数据库] [删除记录] 失败：', err)
    }
  });
}