FROM node:slim

COPY . /versions
RUN cd /versions && npm i

WORKDIR /versions
CMD ["node", "."]
