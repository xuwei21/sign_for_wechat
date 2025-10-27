// pages/index/index.ts
import { PunchRecord, CloudFunctionResult } from '../../../typings/types/punch';

Page({
  data: {
    records: [] as PunchRecord[],
    todayRecord: {} as PunchRecord
  },

  onLoad() {
    this.loadRecords();
  },

  onShow() {
    this.loadRecords();
  },

  // 加载所有记录
  async loadRecords(showLoading: boolean = true) {
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
        this.setData({
          records: records
        });

        // 检查并创建今日记录
        await this.checkAndCreateTodayRecord(records);
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
      }
  },

  // 检查并创建今日记录
  async checkAndCreateTodayRecord(existingRecords: PunchRecord[]) {
    const today = this.getTodayDateString();
    const todayRecord = existingRecords.find(record => record.date === today);

    if (!todayRecord) {
      // 创建今日记录
      const newRecord: Partial<PunchRecord> = {
        date: today,
        clockInTime: null,
        clockOutTime: null
      };

      try {
        const result = await wx.cloud.callFunction({
          name: 'createRecord',
          data: {
            recordData: newRecord
          }
        }) as any;

        if (result.result.success) {
          // 重新加载记录
          this.loadRecords(false);
        }
      } catch (error) {
        console.error('创建今日记录失败:', error);
      }
    } else {
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
    wx.showLoading({
        title: '打卡中...',
        mask: true // 防止触摸穿透
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
        this.loadRecords(false);
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
      }
  },

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

  formatWeekday(dateString: string): string {
    const date = new Date(dateString);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  }
});