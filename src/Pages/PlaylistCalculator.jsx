import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProgressBar from 'react-bootstrap/ProgressBar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';

const PlaylistCalculator = () => {
  const [playlistLink, setPlaylistLink] = useState('');
  const [startVideoNumber, setStartVideoNumber] = useState(1);
  const [endVideoNumber, setEndVideoNumber] = useState(1);
  const [totalLength, setTotalLength] = useState(0);
  const [playlistData, setPlaylistData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [playlistId, setPlaylistId] = useState('');
  const [nextPageToken, setNextPageToken] = useState('');

  // Function to handle form submission
  const handleSubmit = async event => {
    event.preventDefault();
    try {
      await fetchPlaylistData(playlistId, endVideoNumber);
    } catch (error) {
      console.error('Failed to fetch playlist data:', error);
    }
  };

  // Function to extract playlist ID from playlist link
  const extractPlaylistId = link => {
    if (link.length === 0) return;
    try {
      const url = new URL(link);
      return url.searchParams.get('list');
    } catch (error) {
      toast.error('Invalid Playlist Link', {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
      });
      console.error('Invalid Playlist Link:', error);
    }
  };

  // Function to fetch playlist data using YouTube Data API
  const fetchPlaylistData = async (playlistId, endVideoNumber) => {
    try {
      setPlaylistData(null);
      let pageNumber = 0;
      let nextPageToken = '';
      let fetchedItemsCount = 0;
      while (fetchedItemsCount < endVideoNumber) {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${process.env.REACT_APP_API_KEY}${nextPageToken ? '&pageToken=' + nextPageToken : ''}`;
        const response = await axios.get(url);
        if (response.data.items) {
          setPlaylistData(prevData => [...(prevData || []), ...response.data.items]);
          fetchedItemsCount += response.data.items.length;
        }
        if (fetchedItemsCount >= endVideoNumber) break;
        if (!response.data.nextPageToken && pageNumber > 0) {
          toast.error('Videos not found, Range is incorrect', {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
          });
          break;
        }
        nextPageToken = response.data.nextPageToken;
        pageNumber++;
      }
      if (!playlistData) {
        setTimeout(() => {
          calculateTotalLength(startVideoNumber, endVideoNumber);
        }, 3000);
      } else {
        calculateTotalLength(startVideoNumber, endVideoNumber);
      }
    } catch (error) {
      toast.error('Failed to fetch playlist Data', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
      });
      console.error('Failed to fetch playlist data:', error);
    }
  };

  // Function to calculate total length of the playlist from start to end video numbers
  const calculateTotalLength = async (start, end) => {
    if (!playlistData) {
      console.error('Playlist data is not available.');
      return;
    }
    let totalTimeInSeconds = 0;
    setLoading(true);
    let i;
    for (i = start - 1; i < end; i++) {
      const videoData = playlistData[i];
      const videoId = videoData.contentDetails.videoId;
      if (videoData && videoData.contentDetails && videoData.contentDetails.videoId) {
        const durationInSeconds = await fetchVideoDuration(videoId);
        totalTimeInSeconds += durationInSeconds;
        setTotalTime(totalTimeInSeconds);
        setNow(((i - start + 1) / (end - start + 1)) * 100);
      } else {
        console.error(`Content details or video ID is undefined for video at index ${i}.`);
      }
    }
    if (end === i) {
      setNow(0);
      setLoading(false);
    }
    const totalTimeFormatted = formatTime(totalTimeInSeconds);
    setTotalLength(totalTimeFormatted);
  };

  // Function to fetch video duration and calculate total time
  const fetchVideoDuration = async videoId => {
    try {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${process.env.REACT_APP_API_KEY}`);
      if (response.data.items.length > 0) {
        const duration = response.data.items[0].contentDetails.duration;
        const durationInSeconds = parseISO8601Duration(duration);
        return durationInSeconds;
      } else {
        console.error(`No video found for video ID: ${videoId}`);
        return 0;
      }
    } catch (error) {
      console.error(`Failed to fetch video duration for video ID ${videoId}:`, error);
      return 0;
    }
  };

  // Function to parse ISO 8601 duration format
  const parseISO8601Duration = duration => {
    const durationRegex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const [, hours, minutes, seconds] = durationRegex.exec(duration);
    return parseInt(hours || 0) * 3600 + parseInt(minutes || 0) * 60 + parseInt(seconds || 0);
  };

  // Function to format time from seconds to HH:MM:SS
  const formatTime = seconds => {
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper function to calculate the time taken at different speeds
  const calculateTimeAtSpeed = (totalTimeInSeconds, speed) => {
    const timeInSecondsAtSpeed = Math.floor(totalTimeInSeconds / speed);
    return formatTime(timeInSecondsAtSpeed);
  };

  return (
      <div className="w-[90vw] max-w-4xl mx-auto p-6 bg-[rgb(0,0,0,0.7)] shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">
          <a href="/" rel="noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12" viewBox="0 0 500.612 208.352" id="youtube">
              <path fill="#010101"
                    d="M83.743 168.876c-4.007-1.375-6.746-3.24-10.09-6.863-7.024-7.611-7.41-9.883-7.41-43.682 0-32.567.5-35.634 7.044-43.281 9.175-10.718 30.39-10.401 39.45.589 6.017 7.3 6.506 10.55 6.506 43.192 0 25.834-.224 30.14-1.8 34.66-2.416 6.922-9.535 13.619-16.758 15.764-6.812 2.023-10.167 1.949-16.942-.38zm12.455-15.666c4.09-1.57 4.545-5.006 4.545-34.282 0-18.682-.376-28.828-1.13-30.482-2.53-5.554-11.21-5.554-13.74 0-.754 1.654-1.13 11.8-1.13 30.482 0 32.665.417 34.56 7.668 34.825 1.193.043 2.897-.202 3.787-.543zm44.427 15.118c-1.44-.782-3.466-3.128-4.5-5.21-1.745-3.512-1.903-7.104-2.179-49.537l-.297-45.75h19.094v41.877c0 35.843.214 42.057 1.487 43.112 2.216 1.839 5.816.493 9.887-3.697l3.626-3.733V67.832h19v101h-19v-10.17l-4.75 4.217c-2.612 2.319-6.198 4.832-7.968 5.585-4.126 1.753-11.043 1.687-14.4-.136zM24.73 141.08l-.015-27.75-12.357-39.5L.001 34.33l10.04-.287c5.877-.168 10.293.124 10.651.704.337.545 3.524 12.035 7.082 25.533 3.56 13.498 6.698 24.544 6.977 24.546.28.002 2.902-9.108 5.828-20.246 2.927-11.137 5.992-22.612 6.813-25.5l1.493-5.25h10.536c8.584 0 10.438.258 10.003 1.39-.293.764-5.967 18.745-12.607 39.957l-12.073 38.567v55.086h-20l-.014-27.75z"></path>
              <path fill="#d02726"
                    d="M284.873 207.783c-48.855-1.631-62.084-5.108-71.078-18.688-3.634-5.486-7.713-17.764-9.012-27.128-4.56-32.866-3.44-101.4 2.041-125.021 4.964-21.391 16.637-31.87 37.931-34.053C265.673.748 320.203-.42 373.243.14c57.262.604 84.221 1.829 93.975 4.27 19.08 4.773 28.336 18.828 31.563 47.92.61 5.5 1.36 24.702 1.666 42.67 1.234 72.535-4.223 95.61-25.02 105.799-7.853 3.848-12.99 4.732-35.185 6.057-24.106 1.438-122.48 2.025-155.369.927zm24.034-39.536c1.686-.873 5.038-3.404 7.45-5.63l4.386-4.04v10.254h19v-100h-19V145.095l-4.368 4.367c-4.688 4.689-6.584 5.274-9.06 2.798-1.378-1.378-1.572-6.626-1.572-42.5V68.83h-19v43.319c0 47.787.393 51.568 5.768 55.58 3.403 2.539 11.964 2.809 16.396.518zm91.45-.323c1.745-1.064 4.163-4.03 5.5-6.746 2.346-4.764 2.393-5.42 2.722-37.828.36-35.532-.212-41.948-4.386-49.15-2.319-4.002-7.849-7.37-12.104-7.37-4.098 0-9.97 2.757-14.447 6.782l-4.898 4.403V34.83h-18v134h18v-9.232l4.105 3.709c2.258 2.039 5.521 4.324 7.25 5.076 4.643 2.022 12.557 1.798 16.258-.46zm-23.864-16.312l-3.75-2.174v-61.33l4.438-2.354c3.601-1.91 4.968-2.167 7.25-1.366 4.931 1.732 5.462 5.552 5.12 36.78l-.308 27.838-2.806 2.412c-3.435 2.954-5.123 2.987-9.944.194zm84.25 16.135c9.664-4.381 14.016-11.79 14.777-25.158l.5-8.758h-19.278v5.936c0 7.27-1.127 10.446-4.487 12.648-3.787 2.48-8.494.904-10.76-3.605-1.369-2.721-1.75-6.037-1.75-15.23l-.003-11.75h36v-14.683c0-18.48-1.445-24.37-7.676-31.3-5.506-6.123-11.405-8.561-20.324-8.397-7.393.135-12.333 1.978-17.522 6.534-8.48 7.447-9.766 14.082-9.259 47.847.33 21.939.693 27.284 2.117 31.057 2.432 6.442 6.825 11.347 12.858 14.354 6.8 3.386 17.95 3.614 24.807.505zm-21-68.45c0-12.438 3.191-16.682 11.221-14.918 4.031.886 5.78 5.398 5.78 14.919v7.532h-17v-7.532zm-172 12.034v-57.5h22v-19h-63v19h21v115h20v-57.5z"></path>
            </svg>
          </a>{' '}
          Playlist Length Calculator
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-bold mb-2 text-gray-100">Playlist Link:</label>
            <input
                type="text"
                value={playlistLink}
                onChange={e => {
                  setPlaylistLink(e.target.value);
                  setPlaylistId(extractPlaylistId(e.target.value));
                }}
                required
                className="w-full p-2 border text-white bg-transparent border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-red-500"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-2 text-gray-100">Start Video Number:</label>
            <input
                type="number"
                value={startVideoNumber}
                onChange={e => setStartVideoNumber(parseInt(e.target.value))}
                min="1"
                required
                className="w-full p-2 border text-white bg-transparent border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-red-500"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-2 text-gray-100">End Video Number:</label>
            <input
                type="number"
                value={endVideoNumber}
                onChange={e => setEndVideoNumber(parseInt(e.target.value))}
                min="1"
                required
                className="w-full p-2 border text-white bg-transparent border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-red-500"
            />
          </div>
          <button
              type="submit"
              className="w-full py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 shadow-md shadow-red-400 hover:shadow-red-500">
            Calculate Total Length
          </button>
        </form>

        {loading ? (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white">Calculating Total Length ....</h3>
              <ProgressBar now={now} label={`${now}%`} visuallyHidden/>
            </div>
        ) : (
            <div className="mt-6 text-center">
              <h3 className="text-xl font-semibold text-white">Total Length of the Playlist: {totalLength}</h3>
              <div className="mt-4">
                <h4 className="text-lg font-medium text-white">Time taken at different speeds:</h4>
                <ul className="text-white text-lg">
                  <li>At 1.25x speed: {calculateTimeAtSpeed(totalTime, 1.25)}</li>
                  <li>At 1.5x speed: {calculateTimeAtSpeed(totalTime, 1.5)}</li>
                  <li>At 2x speed: {calculateTimeAtSpeed(totalTime, 2)}</li>
                </ul>
              </div>
            </div>
        )}
        <ToastContainer/>
      </div>
  );
};

export default PlaylistCalculator;