// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { date, updateType, time, workDuration } = event
  
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
    
    const record = queryResult.data[0]
    const recordId = record._id
    const updateData = {
      updatedAt: db.serverDate()
    }
    
    // 根据更新类型设置不同的字段
    if (updateType === 'clockIn') {
      updateData.clockInTime = time
      // 上班打卡时清空工作时长（重新开始计算）
      updateData.workDuration = null
    } else if (updateType === 'clockOut') {
      updateData.clockOutTime = time
      
      // 计算工作时长（优先使用客户端计算的，如果没有则在服务端计算）
      if (workDuration) {
        // 使用客户端传递的工作时长
        updateData.workDuration = workDuration
      } else if (record.clockInTime) {
        // 在服务端计算工作时长
        updateData.workDuration = calculateWorkDuration(record.clockInTime, time)
      }
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

/**
 * 计算在岗时长
 * @param {string} clockInTime 上班时间，格式 "HH:mm"
 * @param {string} clockOutTime 下班时间，格式 "HH:mm"
 * @returns {string} 格式化后的时长 "x时x分"
 */
function calculateWorkDuration(clockInTime, clockOutTime) {
  // 解析时间字符串
  const [inHours, inMinutes] = clockInTime.split(':').map(Number)
  const [outHours, outMinutes] = clockOutTime.split(':').map(Number)
  
  // 转换为分钟数
  const inTotalMinutes = inHours * 60 + inMinutes
  const outTotalMinutes = outHours * 60 + outMinutes
  
  // 计算时长（考虑跨天情况）
  let durationMinutes = outTotalMinutes - inTotalMinutes
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60 // 如果下班时间小于上班时间，认为是跨天
  }
  
  // 格式化为"x时x分"
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  
  if (hours === 0) {
    return `${minutes}分`
  } else if (minutes === 0) {
    return `${hours}时`
  } else {
    return `${hours}时${minutes}分`
  }
}