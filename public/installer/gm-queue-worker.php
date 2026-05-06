<?php

if (!isset($argv) || !is_array($argv)) {
    $argv = [__FILE__];
}

array_splice($argv, 1, 0, ['gm-queue-worker']);
$argc = count($argv);

require __DIR__ . '/api_cls.php';
