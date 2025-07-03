FROM ubuntu:22.04

# Set timezone to avoid interactive prompts
ENV TZ=Asia/Jerusalem
ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y \
    curl \
    xvfb \
    fluxbox \
    x11vnc \
    novnc \
    websockify \
    git \
    software-properties-common \
    tzdata

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt install -y nodejs

RUN apt install -y python3 python3-pip build-essential

# Configure timezone explicitly
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

COPY start-dyad.sh /start-dyad.sh
RUN chmod +x /start-dyad.sh

EXPOSE 6080 5900

CMD ["/start-dyad.sh"]