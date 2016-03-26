FROM node:5.7.0-slim

WORKDIR /test

COPY . /test

CMD ["./run.sh"]
