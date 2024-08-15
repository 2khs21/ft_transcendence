up:
	docker compose up --build

build:
	docker compose build

down:
	docker compose down --volumes

fclean:
	-docker ps -qa | xargs -r docker rm
	-docker images -q | xargs -r docker rmi
	-docker volume ls -q | xargs -r docker volume rm

migrate:
	docker compose run backend python manage.py migrate

re:
	make fclean
	make up