// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { recordData } = event
  console.log(recordData)
  try {
    // 逐个写入数据
    const result = await db.collection('records').add({
      data: {
        ...recordData,
        createdAt: db.serverDate(), // 服务器时间
        updatedAt: db.serverDate()
      }
    })
    
    return {
      success: true,
      data: result,
      message: '记录创建成功'
    }
  } catch (error) {
    console.error('创建记录失败:', error)
    return {
      success: false,
      message: '记录创建失败',
      error: error
    }
  }
}