#!/bin/bash

echo "Spawning 100 processes"
for i in {1..100}; do ( ./a.out & ) ; done
