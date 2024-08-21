FROM alpine:3.20

EXPOSE 9180

RUN apk add g++ make

COPY . /code

RUN g++ -o /code/server.out --std=c++17 ./code/Source/*.cpp

CMD ["/code/server.out"]