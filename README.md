# Soube
Soube is a simple music player based on Electronjs. It's simeple and minimalist with a beautiful design.

## Features
 * Notifications showing what song is played.
 * Auto detection of new songs.
 * Idiom. You can change the idiom of the config panel (Do this before anything).
 * Equalizer.
 * Responsive design.
 * Shorcuts to set play/pause,next, prev and disalbe/enable shuffle.
 * Searching by song.

## How to install
 * (Note: Don't get me wrong, but people that is new in linux can be afraid of command lines)

#### Step 1
 ```
 Extract the files and you will see the next folder (Depending the arch. version):
  * soube-linux-ia32
   or
  * soube-linux-x64
 ```
#### Step 2
 * Move the folder using the next command line.

 ```
  sudo mv [Place_where_is_soube_folder]/(soube-linux-ia32 or soube-linux-x64) /op/soube
 ```
#### step 3 
 * Make an icon launcher :)

 ```
 cd /usr/share/applications
 
 sudo touch soube.desktop
 
 sudo gedit soube.desktop 
 ```
 * copy and paste the next
 ```
 [Desktop Entry]
 Version=1.0.0
 Name=Soube
 Exec=/opt/soube/soube
 Terminal=false
 Icon=/opt/soube/resources/app/assets/img/icon.png
 Type=Application
 Categories=Application;MusicPlayer
 ```
 * And then just save it
