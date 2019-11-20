// 云函数入口文件
const cloud = require('wx-server-sdk')
 
cloud.init()
 
 
// event 为调用此云函数传递的参数，传递的参数可通过event.xxx得到
 
exports.main = (event, context) => {
  console.log("timing ... ");
  var args2 = {
      openid: "of1Gv4kVHElVpbeBRNZzQ-VzFVMI",
      formid: "09cda163369a4626b3bc0efb4c08ea8d",
      title: "title",
      message: "message",
      cardid: "075734515d83783c00d1f3d8474986fc"
  };
  cloud.callFunction({
    name: 'unimessage',
    data: args2,
    success: res => {
      console.log("cloud.unimessage:", res);
    },
    fail: res => {
      console.log("cloud.unimessage:", res);
      app.save_err(args2.openid, res);
    },
    complete: () => {
      console.log("cloud.unimessage complete")
    }
  });

  return 0
}


