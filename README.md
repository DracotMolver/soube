![Soube](app/assets/img/icon@1.8x.png)

# Soube

### This project is not longer maintained

Thanks to all the people who downloaded the application and gave me feedback to improve it. Also, thanks to those who forked the project and those who gave me an start.

Soube was a nice project where I learned a lot from my mistakes, but for others reason I stopped working on it for years. I wanted to improve the code of course with a better folder structure, following JS best practices and coding in a clean way, and I think you might see that intention on the development branch. But this is not the end, throw those years I didn't work on Soube I was growing up as a developer, specially with JavaScript and some other importants things like Data Structure. Now, I have a little bit more of knowledge that will help me to bring Soube again but powerful and not only focused on local music file. This new Soube version won't be public until I decide it is stable and good enough to be share it with you all. I won't close this repository, so you are free to use it. Thanks you all!

Soube is a simple and minimalist music player based on Electronjs.

#### Install it on Windows, Mac & Linux

[Soube website](http://soube.diegomolina.cl)

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
  sudo mv [Place_where_is_soube_folder]/[soube-linux-ia32 or soube-linux-x64] /opt/soube
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
