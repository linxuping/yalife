// pages/genCard/genCard.js

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

  bg_url: '',
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
    ]

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
          }
        });
        */wx.getUserInfo({
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

        /*that.setData({
          showCanvas: true
        })
        that.loadPortraitPath("https://alcdn.yojiang.cn/upload/circle/8515/circle/327679/20191117/2862.jpeg   ");*/
        console.log("get image info.");

        // 改变背景图片
        defaultOptions.bg_url = 'https://alcdn.yojiang.cn/upload/circle/22107/circle/327679/20191117/1438.png';

        //把图片保存到本地
        wx.getImageInfo({
          src: defaultOptions.bg_url,
          success: function (res) {
            console.log("img: ", res);
            console.log(res.path);
            defaultOptions.bg_url = res.path;
            that.setData({
              bg: res.path
            })
          },
          fail: function(res) {
            console.log(res);
          }
        })

      }
    });


    //画出图片的方法
    var makeImg = function (imgUrl, callback) {
      try {
        //获得画布
        const ctx = wx.createCanvasContext('myCanvas');
        //获取设备宽高
        var canvasX = that.data.x;
        var canvasY = that.data.y;

        //画背景图
        ctx.drawImage(defaultOptions.bg_url, 1, 0, defaultOptions.bg_width, defaultOptions.bg_height)
        console.log("bg_url: ", defaultOptions.bg_url);

        //画头像
        ctx.save(); // 保存当前ctx的状态
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

        ctx.setFontSize(24)
        ctx.setFillStyle('#969595')
        ctx.setTextAlign('center')
        ctx.fillText(that.data.followText[0], defaultOptions.bg_width * 0.90, defaultOptions.bg_height * 0.94)
        ctx.fillText(that.data.followText[1], defaultOptions.bg_width * 0.90, defaultOptions.bg_height * 0.94 + 40)
        console.log("before draw...");
        //输出图片
        ctx.draw(false, function () {
          console.log("before to temp...");
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
      console.log("_check ... ");
      let localPath = defaultOptions.portraitPath;
      if (!!localPath) {
        makeImg(defaultOptions.portraitPath, function (path) {

          //设置canvas生成的图片地址
          defaultOptions.saveImgPath = path;
          //console.log(defaultOptions.saveImgPath)

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
        setTimeout(_check, 100);
      }
    }

    _check()
  },
  //获得下载图片路径
  loadPortraitPath: function (imgUrl) {
    wx.getImageInfo({
      src: imgUrl,
      success: function (res) {
        defaultOptions.portraitPath = res.path;
      }
    })
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
