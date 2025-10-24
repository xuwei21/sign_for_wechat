// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { date, updateType, time } = event
  
  try {
    // 先查询记录是否存在
    const queryResult = await db.collection('records')
      .where({
        date: date
      })
      .get()
    
    if (queryResult.data.length === 0) {
      return {
        success: false,
        message: '记录不存在'
      }
    }
    
    const recordId = queryResult.data[0]._id
    const updateData = {
      updatedAt: db.serverDate()
    }
    
    // 根据更新类型设置不同的字段
    if (updateType === 'clockIn') {
      updateData.clockInTime = time
    } else if (updateType === 'clockOut') {
      updateData.clockOutTime = time
    }
    
    // 更新记录
    const result = await db.collection('records')
      .doc(recordId)
      .update({
        data: updateData
      })
    
    return {
      success: true,
      data: result,
      message: '记录更新成功'
    }
  } catch (error) {
    console.error('更新记录失败:', error)
    return {
      success: false,
      message: '记录更新失败',
      error: error
    }
  }
}