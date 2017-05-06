#!/bin/bash

sudo socat UDP4-LISTEN:53,fork UDP4:127.0.0.1:8053
