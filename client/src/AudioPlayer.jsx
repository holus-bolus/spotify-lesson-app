import React, { useState, useRef, useEffect } from 'react'

const AudioPlayer = () => {
    const [currentTrack, setCurrentTrack] = useState(null)
    const [tracks, setTracks] = useState([])
    const audioRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)


    useEffect(() => {
        const fetchTracks = async () => {
            try {
                const response = await fetch('http://localhost:3001/tracks')
                const trackList = await response.json()
                setTracks(trackList)
                setCurrentTrack(trackList[0])
            } catch (error) {
                console.error('Error fetching tracks:', error)
            }
        }

        fetchTracks()
    }, [])

    useEffect(() => {
        if (audioRef.current && currentTrack) {
            audioRef.current.load()
        }
    }, [currentTrack])

    const handleTrackChange = (track) => {
        setCurrentTrack(track)
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.load()
            audioRef.current.addEventListener('canplaythrough', () => {
                audioRef.current.play()
                setIsPlaying(true)
            }, { once: true })
        }
    }

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
        }
    }

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration)
        }
    }

    const fetchShuffledPlaylist = async () => {
        try {
            const response = await fetch('http://localhost:3001/shuffle')
            const shuffledTracks = await response.json()
            setTracks(shuffledTracks)
            setCurrentTrack(shuffledTracks[0])  // Set the first shuffled track
        } catch (error) {
            console.error('Error fetching shuffled playlist:', error)
        }
    }

    const formatTime = (time) => {
        if (isNaN(time)) return '00:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60).toString().padStart(2, '0')
        return `${minutes}:${seconds}`
    }

    return (
        <div className="audio-player">
            {currentTrack ? (
                <>
                    <div className="track-info">
                        <img src={currentTrack.cover} alt="Album cover" className="album-cover" />
                        <h3>{currentTrack.name}</h3>
                    </div>
                    <audio
                        ref={audioRef}
                        src={`http://localhost:3001${currentTrack.url}`}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        preload="metadata"
                    />
                    <div className="controls">
                        <button className="play-pause-btn" onClick={togglePlayPause}>
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <div className="progress-bar-container">
                            <span>{formatTime((progress / 100) * duration)}</span>
                            <div className="progress-bar">
                                <div className="progress" style={{ width: `${progress}%` }} />
                            </div>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </>
            ) : (
                <p>Loading track...</p>
            )}
            <div className="playlist">
                <h4>Playlist</h4>
                <button className="shuffle-btn" onClick={fetchShuffledPlaylist}>Shuffle</button>
                <ul>
                    {tracks.map((track, index) => (
                        <li key={index}>
                            <button onClick={() => handleTrackChange(track)}>
                                {track.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default AudioPlayer
