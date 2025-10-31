// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取所有打卡记录
    const result = await db.collection('records').get()
    
    if (result.data.length === 0) {
      return {
        success: true,
        message: '没有找到任何记录'
      }
    }
    
    // 批量更新操作数组
    const updatePromises = []
    
    // 遍历每条记录计算在岗时长
    for (const record of result.data) {
      // 检查是否有必要的打卡时间字段
      if (!record.clockInTime || !record.clockOutTime) {
        console.log(`记录 ${record._id} 缺少打卡时间，跳过计算`)
        continue
      }
      
      // 计算在岗时长（分钟）
      const workDurationMinutes = calculateWorkDuration(
        record.clockInTime, 
        record.clockOutTime
      )
      
      // 转换为"x时x分"格式
      const workDurationFormatted = formatDuration(workDurationMinutes)
      
      // 添加到更新队列
      updatePromises.push(
        db.collection('records').doc(record._id).update({
          data: {
            workDuration: workDurationFormatted
          }
        })
      )
    }
    
    // 批量执行所有更新操作
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
      return {
        success: true,
        message: `成功更新 ${updatePromises.length} 条记录的工时数据`
      }
    } else {
      return {
        success: true,
        message: '没有需要更新的记录'
      }
    }
    
  } catch (error) {
    console.error('处理记录失败:', error)
    return {
      success: false,
      message: '记录处理失败',
      error: error.message
    }
  }
}

/**
 * 计算在岗时长（分钟）
 * @param {string} clockInTime 上班时间，格式 "HH:mm"
 * @param {string} clockOutTime 下班时间，格式 "HH:mm"
 * @returns {number} 在岗时长（分钟）
 */
function calculateWorkDuration(clockInTime, clockOutTime) {
  // 解析时间字符串
  const [inHours, inMinutes] = clockInTime.split(':').map(Number)
  const [outHours, outMinutes] = clockOutTime.split(':').map(Number)
  
  // 转换为分钟数
  const inTotalMinutes = inHours * 60 + inMinutes
  const outTotalMinutes = outHours * 60 + outMinutes
  
  // 计算时长（考虑跨天情况）
  let duration = outTotalMinutes - inTotalMinutes
  if (duration < 0) {
    duration += 24 * 60 // 如果下班时间小于上班时间，认为是跨天
  }
  
  return duration
}

/**
 * 格式化时长为"x时x分"格式
 * @param {number} totalMinutes 总分钟数
 * @returns {string} 格式化后的时长
 */
function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  if (hours === 0) {
    return `${minutes}分`
  } else if (minutes === 0) {
    return `${hours}时`
  } else {
    return `${hours}时${minutes}分`
  }
}