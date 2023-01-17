module.exports = class withSpeed {
    SPEED_INTERVAL = 1.3
    constructor({data: {WeekendInfo: { TrackLength }}}) {
        this.speedByCarIdx = []
        this.udpateDistByCarIdx = []
        this.trackLength = Number(TrackLength.split(' ')[0])
        this.lastTick = 0
    }

    withSpeed(values) {
        const { CarIdxLapDistPct, SessionTime } = values
        const timeDiff = SessionTime - this.lastTick

        if (timeDiff < this.SPEED_INTERVAL) return {
            ...values, 
            LengthOfTrack: this.trackLength,
            SpeedByCarIdx: this.speedByCarIdx 
        }
        
        this.speedByCarIdx = CarIdxLapDistPct.reduce((acc, pct, idx) => {
            const lastUpdatePct = this.udpateDistByCarIdx[idx] || 0
            const distancePct = pct - lastUpdatePct
            const pctOfTrackTraveled = (distancePct) * this.trackLength
            const speed = ((pctOfTrackTraveled / timeDiff) *60) *60
            acc[idx] = speed
            this.udpateDistByCarIdx[idx] = pct
            return acc
        }, [])

        this.lastTick = SessionTime
        return {
            ...values,
            LengthOfTrack: this.trackLength,
            SpeedByCarIdx: this.speedByCarIdx
        }
    }
}