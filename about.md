# Haste

Sharing code is a good thing, and it should be _really_ easy to do it.
A lot of times, I want to show you something I'm seeing - and that's where we use pastebins.

Haste is the prettiest, easist to use pastebin ever made.

## From the Console

Most of the time I want to show you some text, its coming from my current console session.
We should make it really easy to take code from the console and send it to people.

`cat something | haste` # http://hastebin.com/1238193

You can even take this a step further (on OSX) and cut out the last step of copying the URL with:

`cat something | haste | pbcopy`

After running that, the STDOUT output of `cat something` will show up at a URL which has
been conveniently copied to your clipboard.

That's all there is to that, and you can install it with `gem install haste` right now.

## Author

Code by John Crepezzi <john.crepezzi@gmail.com>
Design by Brian Dawson

