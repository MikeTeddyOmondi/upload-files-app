FROM lipanski/docker-static-website:2.4.0
COPY ./ ./
CMD ["/busybox-httpd", "-f", "-v", "-p", "3000", "-c", "httpd.conf"]