// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取当前用户的所有打卡记录，按日期倒序排列
    const result = await db.collection('records')
      .orderBy('date', 'desc')
      .get()
    
    return {
      success: true,
      data: result.data,
      message: '记录获取成功'
    }
  } catch (error) {
    console.error('获取记录失败:', error)
    return {
      success: false,
      message: '记录获取失败',
      error: error
    }
  }
}