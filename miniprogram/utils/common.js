var db = wx.cloud.database();
const app = getApp()


class Common {
  static local_trim(str,max) {
    str = str.replace("广东省", "").replace("广州市", "").replace("番禺区", "").replace("石楼镇", "").replace("广州亚运城", "");
    return Common.slice(str, 12);
  };

  static slice(str,max) {
    if (str.length > max) {
      str = str.slice(0,max) + '...';
    }
    return str;
  };
}

module.exports = Common;
