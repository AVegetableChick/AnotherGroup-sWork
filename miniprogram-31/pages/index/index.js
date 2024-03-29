var myCharts = require("../../utils/wxcharts.js")//引入一个绘图的插件

const devicesId = "656381370" // 填写在OneNet上获得的devicesId 形式就是一串数字 例子:9939133
const api_key = "b0Oyx8sguBphggha43nnQT6fFfA=" // 填写在OneNet上的 api-key 例子: VeFI0HZ44Qn5dZO14AuLbWSlSlI=

Page({
  data: {},

  /**
   * @description 页面下拉刷新事件
   */


  onPullDownRefresh: function () {
    wx.showLoading({
      title: "正在获取"
    })
    this.getDatapoints().then(datapoints => {
      this.update(datapoints)
      wx.hideLoading()
    }).catch((error) => {
      wx.hideLoading()
      console.error(error)
    })
  },

  /**
   * @description 页面加载生命周期
   */
  onLoad: function () {
    console.log(`your deviceId: ${devicesId}, apiKey: ${api_key}`)

    //每隔0.5s自动获取一次数据进行更新
    const timer = setInterval(() => {
      this.getDatapoints().then(datapoints => {
        this.update(datapoints)
      })
    }, 6000)

    wx.showLoading({
      title: '加载中'
    })

    this.getDatapoints().then((datapoints) => {
      wx.hideLoading()
      this.firstDraw(datapoints)
    }).catch((err) => {
      wx.hideLoading()
      console.error(err)
      clearInterval(timer) //首次渲染发生错误时禁止自动刷新
    })
  },

  /**
   * 向OneNet请求当前设备的数据点
   * @returns Promise
   */
  getDatapoints: function () {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://api.heclouds.com/devices/${devicesId}/datapoints?datastream_id=distance&limit=20`,
        /**
         * 添加HTTP报文的请求头, 
         * 其中api-key为OneNet的api文档要求我们添加的鉴权秘钥
         * Content-Type的作用是标识请求体的格式, 从api文档中我们读到请求体是json格式的
         * 故content-type属性应设置为application/json
         */
        header: {
          'content-type': 'application/json',
          'api-key': api_key
        },
        success: (res) => {
          const status = res.statusCode
          const response = res.data
          if (status !== 200) { // 返回状态码不为200时将Promise置为reject状态
            reject(res.data)
            return ;
          }
          if (response.errno !== 0) { //errno不为零说明可能参数有误, 将Promise置为reject
            reject(response.error)
            return ;
          }

          if (response.data.datastreams.length === 0) {
            reject("当前设备无数据, 请先运行硬件实验")
          }

          //程序可以运行到这里说明请求成功, 将Promise置为resolve状态
          resolve({
            distance: response.data.datastreams[0].datapoints.reverse(),
            // light: response.data.datastreams[1].datapoints.reverse(),
            
          })
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * @param {Object[]} datapoints 从OneNet云平台上获取到的数据点
   * 传入获取到的数据点, 函数自动更新图标
   */
  update: function (datapoints) {
    const map = this.convert(datapoints);

   

    // this.lineChart_light.updateData({
    //   categories: map.categories,
    //   series: [{
    //     name: 'light',
    //     data: map.light,
    //     format: (val, name) => val.toFixed(2)
    //   }],
    // })

    this.linechart_dis.updateData({
      categories: map.categories,
      series: [{
        name: 'distance',
        data: map.distance,
        format: (val, name) => val.toFixed(2)
      }],
    })

  },

  /**
   * 
   * @param {Object[]} datapoints 从OneNet云平台上获取到的数据点
   * 传入数据点, 返回使用于图表的数据格式
   */
  convert: function (datapoints) {
    var categories = [];
    var direction = [];
    var light = [];
    var distance = [];
    var length = datapoints.distance.length
    
    for (var i = 0; i < length; i++) {
     
      
      //light.push(datapoints.light[i].value);
      distance.push(datapoints.distance[i].value);
    }
    return {
      categories: categories,
     
      //light: light,
      distance: distance
    }
  },

  /**
   * 
   * @param {Object[]} datapoints 从OneNet云平台上获取到的数据点
   * 传入数据点, 函数将进行图表的初始化渲染
   */
  firstDraw: function (datapoints) {

    //得到屏幕宽度
    var windowWidth = 320;
    try {
      var res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }

    var map = this.convert(datapoints);

    //新建湿度图表
    
    // // 新建光照强度图表
    // this.lineChart_light = new myCharts({
    //   canvasId: 'light',
    //   type: 'line',
    //   categories: map.categories,
    //   animation: false,
    //   background: '#f5f5f5',
    //   series: [{
    //     name: 'light',
    //     data: map.light,
    //     format: function (val, name) {
    //       return val.toFixed(2);
    //     }
    //   }],
    //   xAxis: {
    //     disableGrid: true
    //   },
    //   yAxis: {
    //     title: 'light (lux)',
    //     format: function (val) {
    //       return val.toFixed(2);
    //     }
    //   },
    //   width: windowWidth,
    //   height: 200,
    //   dataLabel: false,
    //   dataPointShape: true,
    //   extra: {
    //     lineStyle: 'curve'
    //   }
    // });

    //新建温度图表
    this.linechart_dis = new myCharts({
      canvasId: 'distance',
      type: 'line',
      categories: map.categories,
      animation: false,
      background: '#f5f5f5',
      series: [{
        name: 'distance',
        data: map.distance,
        format: function (val, name) {
          return val.toFixed(2);
        }
      }],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        title: 'distance(cm)',
        format: function (val) {
          return val.toFixed(2);
        }
      },
      width: windowWidth,
      height: 200,
      dataLabel: false,
      dataPointShape: true,
      extra: {
        lineStyle: 'curve'
      }
    });
  },
})
