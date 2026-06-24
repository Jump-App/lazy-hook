FROM ubuntu

RUN apt-get update \
  && apt-get install -y \
    curl \
    git \
    inotify-tools \
    unzip \
  && rm -rf /var/lib/apt/lists/*

USER ubuntu

RUN curl -fsSL https://bun.sh/install | bash
RUN curl -fsSL https://elixir-lang.org/install.sh | sh -s -- elixir@1.20.2 otp@28.4
ENV PATH="/home/ubuntu/.elixir-install/installs/otp/28.4/bin:/home/ubuntu/.elixir-install/installs/elixir/1.20.2-otp-28/bin:${PATH}"
