-- Banners y fotos de producto: 5 MB era insuficiente para JPG/PNG de alta resolución.
update storage.buckets
set file_size_limit = 10485760
where id = 'shop-media';
