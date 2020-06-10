#!/bin/bash

# scp 
# -r means recursive
# -p preserves modification times, access times, and modes from the original file.

# Will ask Password. Password: Avaya123!
scp -rp ./bundle/widgets root@192.168.1.160:/var/www/html