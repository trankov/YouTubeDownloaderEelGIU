import json
import os

from tkinter import filedialog
from tkinter import *

import eel

from pytube import YouTube


eel.init('eel_gui', allowed_extensions=['.js', '.html'])

ytkeys = ('age_restricted', 'author', 'channel_id', 'channel_url',
          'description', 'embed_url', 'keywords', 'length',
          'rating', 'thumbnail_url', 'title', 'video_id', 'views', 'watch_url')

keylist = ('itag', 'mime_type', 'resolution', 'fps', 'video_codec',
           'type', 'subtype', 'abr', 'audio_codec', 'bitrate', 'codecs')


@eel.expose
def py_getpath():
    '''Choose Folder dialog. Launches from Javascript.'''

    root = Tk()
    root.withdraw()
    root.wm_attributes('-topmost', 1)
    initdir = os.path.normpath(os.path.expanduser('~/Downloads'))
    initdir = initdir if os.path.exists(initdir) else os.path.normpath(os.path.curdir)
    return filedialog.askdirectory(initialdir = initdir, title = "Where to save?")


@eel.expose
def py_get_datas(url):
    '''Returns JSON with video info or error info to js'''

    try:
        yt = YouTube(url)
        tracks = [{i : stream.__dict__[i] for i in keylist} for stream in yt.streams]
        info = {i : getattr(yt, i) for i in ytkeys}
        info['tracks'] = tracks
        info['publish_date'] = yt.publish_date.isoformat()
        return json.dumps(info, ensure_ascii=False)
    except:
        return "ERROR"


def catch_progress (stream, chunk, bytes_remaining):
    '''On download progress callback, send data to js'''
    eel.show_progress_js(bytes_remaining)


def catch_complete (stream, file_path):
    '''On download complete callback, send data to js'''
    eel.show_complete_js(file_path)


@eel.expose
def py_download_track(url, itag, path):
    '''Downloading track. Corresponding with GUI via callbacks.'''

    ytb = YouTube(url,
                  on_progress_callback = catch_progress,
                  on_complete_callback = catch_complete)
    track = ytb.streams.get_by_itag(itag)
    eel.setsize_js(track.filesize)
    track.download(output_path=path,
                   filename_prefix=f'itag_{itag} ')
    # Тут надо дописать обработчик ошибок если загрузка сорвалась


eel.start('main.html',
          port=1488,
          size=(1024, 750))
