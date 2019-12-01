// pages/genCard/genCard.js
const app = getApp()

const bgUrl = "https://alcdn.yojiang.cn/upload/circle/8088/circle/327679/20191201/9834.jpeg";

// 预设一个default对象
var defaultOptions = {
  nickName: '',
  nickname_pos: [375, 265],
  nickname_color: '#eeeeee',
  nickname_size: 30,
  nickname_align: 'left',

  code_pos: [405, 1021],
  code_width: 200,
  code_height: 200,
  codePath: '/images/genbg.jpg',

  bg_url: bgUrl,
  bg_width: 750,
  bg_height: 1334,

  wx_icon_width: 100,
  wx_icon_height: 100,
  wx_icon_pos: [310, 100]
};

var that = null;

var imgsurl = [];

Page({
  /**
   * 页面的初始数据
   */
  data: {
    x: wx.getSystemInfoSync().windowWidth,
    y: wx.getSystemInfoSync().windowHeight,
    avatarUrl: '',
    nickName: '',
    gender: '',
    userInfo: {},
    showCanvas: '',
    inviteCardUrl: '',
    bg: '',
    showLoading: true,
    followText: [
      "我也要玩",
      "搜索“搞嘢吧”"
    ],
    testurl: "",
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("onload.");
    setTimeout(function (e) {
      defaultOptions.nickName = "abc";
      console.log(defaultOptions.nickName);
    }, 1);
    var that = this;

    /*
    wx.getUserInfo({
      success: function (res) {
        var userInfo = res.userInfo;
        var gender = userInfo.gender;
        console.log(gender);
        that.setData({
          userInfo: userInfo,
          gender: gender
        })
      },
      fail: function(res){
        console.log(res);
      }
    })*/

    wx.getSetting({
      success (res){
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: function(res) {
              console.log(res.userInfo)
              var userInfo = res.userInfo;
              var gender = userInfo.gender;
              console.log(gender);
              that.setData({
                userInfo: userInfo,
                gender: gender
              })
            }
          })
        }
      },
      fail (res) {
        console.log(res);
      }
    });
  },
  onShow: function (options) {
    console.log("onshow.");
    setTimeout(function (e) {
      defaultOptions.nickName = "abc";
      console.log();
    }, 1)
  },
  onReady: function (options) {
    console.log("onready.");
    var that = this;
    //获得用户信息
    
    wx.login({
      success: function () {
        wx.getSetting({
          success (res){
            if (res.authSetting['scope.userInfo']) {
              // 已经授权，可以直接调用 getUserInfo 获取头像昵称
              wx.getUserInfo({
                success: function(res) {
                  console.log(res.userInfo);
                  that.setData({
                    showCanvas: true
                  });
                  that.loadPortraitPath(res.userInfo.avatarUrl);
                }
              })
            }
          },
          fail(res) {
            console.log(res);
          }
        });
        /*wx.getUserInfo({
          success: function (res) {
            that.setData({
              showCanvas: true
            })
            that.loadPortraitPath(res.userInfo.avatarUrl)
          },
          fail: function(res) {
            console.log(res);
          }
        });*/

        that.setData({
          showCanvas: true
        })
        that.loadPortraitPath("https://alcdn.yojiang.cn/upload/circle/8515/circle/327679/20191117/2862.jpeg");
        console.log("get image info.");

        // 改变背景图片
        defaultOptions.bg_url = '';

        //把图片保存到本地
        wx.getImageInfo({
          src: bgUrl, //defaultOptions.bg_url,
          success: function (res) {
            console.log("getImageInfo: ", res);
            defaultOptions.bg_url = res.path;
            that.setData({
              bg: res.path,
              bg_width: res.width,
              bg_height: res.height,
            });

            wx.cloud.callFunction({
              name: 'qrcode',
              data: {
              },
              success: res => {
                console.log("qrcode: ", res);
                var base64Url = 'data:' + res.result.contentType + ';base64,' + wx.arrayBufferToBase64(res.result.buffer);
                /*that.setData({
                  testurl: 'data:' + res.result.contentType + ';base64,' + wx.arrayBufferToBase64(res.result.buffer)
                });*/


                console.log("get qrcode url: ", res);

                let fsm = wx.getFileSystemManager();
                var tmpPath = wx.env.USER_DATA_PATH + '/qrcode_share.png'
                fsm.writeFile({
                  filePath: tmpPath,
                  data: res.result.buffer,
                  encoding: 'utf8',
                  success: res => {
                    console.info("write file: ", res)
                    defaultOptions.qrcode = tmpPath;
                    _check();
                  },
                  fail: res => {
                    console.info(res)
                  }
                });

              },
              fail: res => {
                console.log("msg_unread_reset:", res)
              }
            });

          },
          fail: function(res) {
            console.log(res);
          }
        })
      }
    });

    /*
      canvas文字换行
      str:要绘制的字符串
      ctx:canvas对象
      initX:绘制字符串起始x坐标
      initY:绘制字符串起始y坐标
      lineHeight:字行高，自己定义个值即可
      canvasWidth:画布的宽度
    */
    var canvasTextAutoLine = function (str, ctx, initX, initY, lineHeight, canvasWidth) {
      const arrText = str.split('')//字符串分割为数组
      let currentText = ''// 当前字符串及宽度
      let currentWidth
      for (let letter of arrText) {
        currentText += letter
        currentWidth = ctx.measureText(currentText).width
        if (currentWidth > canvasWidth) {
          console.log("debug: ", currentText, currentWidth, canvasWidth);
          ctx.fillText(currentText, initX, initY)
          currentText = ''
          initY += lineHeight
        }
      }
      if (currentText) {
        ctx.fillText(currentText, initX, initY)
      }
    };


    //画出图片的方法
    var makeImg = function (imgUrl, callback) {
      try {
        //获得画布
        const ctx = wx.createCanvasContext('myCanvas');
        //获取设备宽高
        var canvasX = that.data.x;
        var canvasY = that.data.y;

        console.log("before drawImage: ", defaultOptions);
        
        //画背景图
        ctx.drawImage(defaultOptions.bg_url, 0, 0, defaultOptions.bg_width, defaultOptions.bg_height)
        ctx.save(); 

        /*var x = defaultOptions.bg_width - 260;
        var y = defaultOptions.bg_height - 125; 
        var d = 120;
        var r = 60;

        var cx = x + r;
        var cy = y + r;
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(defaultOptions.qrcode, x, y, d, d);
        ctx.restore();*/

        ctx.drawImage(defaultOptions.qrcode, defaultOptions.bg_width - 585, defaultOptions.bg_height-138, 135, 135)
        
        //画头像
        ctx.save(); // 保存当前ctx的状态
        
        /*
        //设置圆半径
        let radius = 60;
        ctx.arc(375, 170, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(defaultOptions.portraitPath, defaultOptions.wx_icon_pos[0], defaultOptions.wx_icon_pos[1], defaultOptions.wx_icon_width * 1.3, defaultOptions.wx_icon_height * 1.3);
        ctx.restore();

        ctx.setFillStyle('#000000');
        ctx.setFontSize(40);
        ctx.setTextAlign('center')
        ctx.setTextBaseline('middle');
        ctx.fillText(defaultOptions.nickName, defaultOptions.nickname_pos[0], defaultOptions.nickname_pos[1]);
*/
        ctx.setFontSize(24)
        ctx.setFillStyle('#969595')
        ctx.setTextAlign('center')
        ctx.fillText(that.data.followText[0], defaultOptions.bg_width * 0.090, defaultOptions.bg_height * 0.094)
        ctx.fillText(that.data.followText[1], defaultOptions.bg_width * 0.090, defaultOptions.bg_height * 0.094 + 40)
        canvasTextAutoLine("如果网络图片地址是异步请求过来的数据，需要先使用wx.downloadFile()的方式，把图片下载到本地，再把临时的本地路径使用drawImage()绘制", ctx, defaultOptions.bg_width * 1/2, defaultOptions.bg_height * 0.094 + 120, 40, that.data.x);
        
        console.log("before draw...", defaultOptions);
        //输出图片
        ctx.draw(false, function () {
          console.log("before to temp...", defaultOptions);
          wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            width: defaultOptions.bg_width,
            height: defaultOptions.bg_height,
            destWidth: defaultOptions.bg_width,
            destHeight: defaultOptions.bg_height,
            canvasId: 'myCanvas',
            success: function (res) {
              //console.log(res.tempFilePath);
              callback(res.tempFilePath)
              console.log("canvasToTempFilePath: ", res);
            },
            fail: function(res) {
              console.log("fail: ", res);
            }
          })
        });
        console.log("after draw...");
      } catch (err) {
        console.log(err);
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
        });
      }

    }

    //检查是否已经下载了微信头像
    var _check = function () {
      //defaultOptions.portraitPath = "https://alcdn.yojiang.cn/upload/circle/22107/circle/327679/20191117/1438.png";
      let localPath = defaultOptions.portraitPath; //defaultOptions.portraitPath;
      console.log("_check ... ", localPath);
      if (!!localPath) {
        makeImg(defaultOptions.portraitPath, function (path) {
          //设置canvas生成的图片地址
          defaultOptions.saveImgPath = path;
          //console.log(defaultOptions.saveImgPath)
          console.log("make img ... ", path);

          if (path) {
            that.showLoading()
          }

          //隐藏画布,显示输出的图片
          that.setData({
            showCanvas: false,
            inviteCardUrl: path
          })

        })
      } else {
        setTimeout(_check, 1000);
      }
    }

    //_check()
  },
  //获得下载图片路径
  loadPortraitPath: function (imgUrl) {
    wx.getImageInfo({
      src: imgUrl,
      success: function (res) {
        defaultOptions.portraitPath = res.path;
      }
    })
    defaultOptions.portraitPath = imgUrl;
  },
  //保存图片
  save: function () {
    //保存图片到手机
    wx.saveImageToPhotosAlbum({
      filePath: defaultOptions.saveImgPath,
      success(res) {
        console.log("saved");
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail(res) {
        wx.showToast({
          title: '保存失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  // loding设置
  showLoading: function () {
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      duration: 200
    });
  },
  cancelLoading: function () {
    wx.hideToast();
  },
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: '邀请朋友来玩',
      path: '/pages/love/love',
      success: function (res) {
        // 转发成功
        console.log(res)
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  // 预览图片
  previewImage: function (e) {
    var current = e.target.dataset.src;
    imgsurl.push(defaultOptions.saveImgPath)
    wx.previewImage({
      current: current, // 当前显示图片的http链接
      urls: imgsurl // 需要预览的图片http链接列表
    })
  },
  authMsg: function(e) {
    wx.requestSubscribeMessage({
      tmplIds: ['4RZPg5LMYit7d7eC6Qti-SO3tPMFatfq1MB6bAsAMlg'],
      success(res) {
        console.log("requestSubscribeMessage: ", res);
      },
      fail(res) {
        console.log("requestSubscribeMessage: ", res);
      }
    })
  },
  sendMsg: function (e) {
    var args = {
      openid: "of1Gv4kVHElVpbeBRNZzQ-VzFVMI",
      title: "tt",
      message: "mm",
      cardid: "23db0a155dcb4a9f05edc89c0c89fff3"
    };
    console.log("发送message：", args);
    wx.cloud.callFunction({
      name: 'submessage',
      data: args,
      success: res => {
        console.log(res);
      },
      fail: res => {
        console.log(res);
      },
      complete: () => {
        console.log("message:")
      }
    });
  }
})
