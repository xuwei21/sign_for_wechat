import { PunchRecord } from '../../../typings/types/punch';

interface MonthlyStat {
    month: string;
    totalHours: string;
    workDays: number;
    dailyAverage: string;
}

interface YearSummary {
    totalHours: string;
    monthlyAverage: string;
    workMonths: number;
}

Page({
    data: {
        records: [] as PunchRecord[],
        monthlyStats: [] as MonthlyStat[],
        yearSummary: null as YearSummary | null,
        yearRange: [] as string[],
        selectedYearIndex: 0,
        selectedYear: '',
        isLoading: false,
    },

    onLoad() {
        this.initYearRange();
        this.loadRecords();
    },

    onShow() {
        this.loadRecords();
    },

    // 初始化年份选择范围
    initYearRange() {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear; year >= currentYear - 5; year--) {
            years.push(year.toString());
        }

        this.setData({
            yearRange: years,
            selectedYear: currentYear.toString(),
            selectedYearIndex: 0
        });
    },

    // 年份选择变化
    onYearChange(e: any) {
        const index = e.detail.value;
        const selectedYear = this.data.yearRange[index];

        this.setData({
            selectedYearIndex: index,
            selectedYear: selectedYear
        });

        this.calculateStatistics();
    },

    // 加载记录数据
    async loadRecords() {
        if (this.data.isLoading) return;

        this.setData({ isLoading: true });
        wx.showLoading({
            title: '加载中...',
            mask: true
        });

        try {
            const result = await wx.cloud.callFunction({
                name: 'getRecord'
            }) as any;

            if (result.result.success) {
                const records: PunchRecord[] = result.result.data;
                this.setData({
                    records: records
                });
                this.calculateStatistics();
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

    // 计算统计数据
    calculateStatistics() {
        const { records, selectedYear } = this.data;

        // 按月份分组记录
        const monthlyData: { [key: string]: PunchRecord[] } = {};

        records.forEach(record => {
            const recordYear = record.date.substring(0, 4);
            if (recordYear === selectedYear) {
                const month = record.date.substring(5, 7);
                if (!monthlyData[month]) {
                    monthlyData[month] = [];
                }
                monthlyData[month].push(record);
            }
        });

        // 计算每月统计
        const monthlyStats: MonthlyStat[] = [];
        let yearTotalHours = 0;
        let workMonthsCount = 0;

        for (let month = 1; month <= 12; month++) {
            const monthKey = month.toString().padStart(2, '0');
            const monthRecords = monthlyData[monthKey] || [];

            let monthTotalMinutes = 0;
            let workDays = 0;

            monthRecords.forEach(record => {
                if (record.clockInTime && record.clockOutTime) {
                    const workMinutes = this.calculateWorkMinutes(record.clockInTime, record.clockOutTime);
                    monthTotalMinutes += workMinutes;
                    workDays++;
                }
            });

            const totalHours = (monthTotalMinutes / 60).toFixed(1);
            const dailyAverage = workDays > 0 ? (monthTotalMinutes / workDays / 60).toFixed(2) : '0.00';

            monthlyStats.push({
                month: month.toString(),
                totalHours,
                workDays,
                dailyAverage
            });


            if (workDays > 0) {
                yearTotalHours += parseFloat(totalHours);
                workMonthsCount++;
            }
        }

        // 计算年度汇总
        const yearSummary: YearSummary = {
            totalHours: yearTotalHours.toFixed(2),
            monthlyAverage: workMonthsCount > 0 ? (yearTotalHours / workMonthsCount).toFixed(2) : '0.00',
            workMonths: workMonthsCount
        };

        this.setData({
            monthlyStats,
            yearSummary
        });
    },

    // 计算工作时长（分钟）
    calculateWorkMinutes(clockInTime: string, clockOutTime: string): number {
        const [inHour, inMinute] = clockInTime.split(':').map(Number);
        const [outHour, outMinute] = clockOutTime.split(':').map(Number);

        const inTotalMinutes = inHour * 60 + inMinute;
        const outTotalMinutes = outHour * 60 + outMinute;

        return outTotalMinutes - inTotalMinutes;
    },
});