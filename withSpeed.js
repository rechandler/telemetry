module.exports = class withSpeed {
    SPEED_INTERVAL = 1.3
    constructor() {
        this.speedByCarIdx = []
        this.udpateDistByCarIdx = []
        this.lastTick = null
        this.trackLength = null
    }

    setTrackLength(trackLength) {
        this.trackLength = Number(trackLength.split(' ')[0])
    }

    withSpeed(values) {
        const { SessionTime, CarIdxLapDistPct } = values
        // Must have both to calc speed
        if (!SessionTime || !this.trackLength) return {
            ...values, 
            LengthOfTrack: this.trackLength,
            SpeedByCarIdx: this.speedByCarIdx 
        }

        const timeDiff = SessionTime - this.lastTick
        if (timeDiff < this.SPEED_INTERVAL) return {
            ...values, 
            LengthOfTrack: this.trackLength,
            SpeedByCarIdx: this.speedByCarIdx 
        }

        this.speedByCarIdx = CarIdxLapDistPct.reduce((acc, pct, idx) => {
            if (pct < 0) {
                // handle differently?
                acc[idx] = -1
                return acc
            }
            const lastUpdatePct = this.udpateDistByCarIdx[idx]
            const distancePct = pct - lastUpdatePct
            // if (distancePct < 0) return acc
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