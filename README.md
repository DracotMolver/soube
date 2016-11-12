# Soube
Soube is a simple and minimalist music player based on Electronjs.


## Features
 * Notifications showing what song is played.
 * Auto detection of new songs.
 * Idiom. You can change the idiom of the config panel (Do this before anything).
 * Equalizer.
 * Responsive design.
 * Shorcuts to set play/pause,next, prev and disalbe/enable shuffle.
 * Searching by song.

## Linux users
 * For Distributions that don't use **rpm** or **deb** extensions, you have to follow the steps below.

#### Step 1

 ```
 Extract the files and you will see the next folder:
  * soube-linux-ia32
   or
  * soube-linux-x64
 ```

#### Step 2
 * Move the folder using the next command line.

 ```
  sudo mv [Place_where_is_soube_folder]/[soube-linux-ia32 or soube-linux-x64] /op/soube
 ```

#### step 3 
 * Download the [soube.desktop](https://github.com/DracotMolver/Soube/blob/master/soube.desktop) file for an icon launcher and move it to this location (or your prefer one):

 ```
 sudo  [Place_where_is_the_file]/soube.desktop /usr/share/applications
 
 ```

 * Done!. You should be ready to use Soube.

## Shortcuts

 * Ctrl + F      // Display the searching option
 * Ctrl + Up     // Set Play/Pause the song
 * Ctrl + Left   // Prev song
 * Ctrl + Right  // Next song
 * Ctrl + Down   // Switch shuffle
