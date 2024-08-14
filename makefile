up:
	docker compose up

build:
	docker compose up --build

down:
	docker compose down --volume

fclean:
	-docker ps -qa | xargs -r docker rm
	-docker images -q | xargs -r docker rmi
	-docker volume ls -q | xargs -r docker volume rm

migrate:
	docker compose run backend python manage.py migrate

re:
	make fclean
	make up