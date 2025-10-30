// pages/index/index.ts
import { PunchRecord, CloudFunctionResult } from '../../../typings/types/punch';

Page({
  data: {
    records: [] as PunchRecord[],
    todayRecord: {} as PunchRecord,
    isLoading: false, // 添加加载状态防止重复请求
  },

  onLoad() {
    this.loadRecords();
  },

  onShow() {
    this.loadRecords();
  },

  // 加载所有记录
  async loadRecords(showLoading: boolean = true) {
    if (this.data.isLoading) return;
    
    this.setData({ isLoading: true });

    if (showLoading) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'getRecord'
      }) as any;

      if (result.result.success) {
        const records: PunchRecord[] = result.result.data;
        // 为每条记录添加星期几信息
        const recordsWithWeekday = records.map(record => ({
          ...record,
          weekday: this.formatWeekday(record.date)
        }));
        
        this.setData({
          records: recordsWithWeekday
        });

        await this.checkAndCreateTodayRecord(recordsWithWeekday);
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载记录失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },

  // 检查并创建今日记录
  async checkAndCreateTodayRecord(existingRecords: PunchRecord[]) {
    const today = this.getTodayDateString();
    const todayRecord = existingRecords.find(record => record.date === today);

    if (!todayRecord) {
      console.log('创建新的今日记录:', today);
      
      const newRecord: Partial<PunchRecord> = {
        date: today,
        clockInTime: null,
        clockOutTime: null,
        weekday: this.formatWeekday(today) // 添加星期几
      };

      try {
        const result = await wx.cloud.callFunction({
          name: 'createRecord',
          data: {
            recordData: newRecord
          }
        }) as any;

        if (result.result.success) {
          console.log('今日记录创建成功');
          const newRecordWithWeekday = {
            ...result.result.data,
            weekday: this.formatWeekday(today)
          };
          const updatedRecords = [...existingRecords, newRecordWithWeekday as PunchRecord];
          this.setData({
            records: updatedRecords,
            todayRecord: newRecordWithWeekday
          });
        }
      } catch (error) {
        console.error('创建今日记录失败:', error);
      }
    } else {
      console.log('今日记录已存在:', todayRecord);
      this.setData({
        todayRecord: todayRecord
      });
    }
  },

  // 上班打卡
  async handleClockIn() {
    await this.updatePunchRecord('clockIn');
  },

  // 下班打卡
  async handleClockOut() {
    await this.updatePunchRecord('clockOut');
  },

  // 更新打卡记录
  async updatePunchRecord(updateType: 'clockIn' | 'clockOut') {
    if (this.data.isLoading) return;
    
    this.setData({ isLoading: true });
    
    wx.showLoading({
      title: '打卡中...',
      mask: true
    });

    const today = this.getTodayDateString();
    const currentTime = this.getCurrentTimeString();

    try {
      const result = await wx.cloud.callFunction({
        name: 'updateRecord',
        data: {
          date: today,
          updateType: updateType,
          time: currentTime
        }
      }) as any;

      if (result.result.success) {
        wx.showToast({
          title: '打卡成功',
          icon: 'success'
        });
        // 重新加载记录
        await this.loadRecords(false);
      } else {
        wx.showToast({
          title: '打卡失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('打卡失败:', error);
      wx.showToast({
        title: '打卡失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },

  // 获取今日日期字符串 (yyyy-MM-dd)
  // 获取今日日期字符串 (yyyy-MM-dd)
  getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 获取当前时间字符串 (HH:mm)
  getCurrentTimeString(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 格式化星期几
  formatWeekday(dateString: string): string {
    const date = new Date(dateString);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  }
});