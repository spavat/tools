<?php

declare(strict_types=1);

// Classe de téléchargement SimplePie qui nettoie le corps de la réponse.
// FreshRSS >= 1.24 utilise SimplePie avec namespaces, les versions plus anciennes SimplePie_File.
if (class_exists('\SimplePie\File')) {
	class FeedJunkCleanerFile extends \SimplePie\File {
		public function __construct(...$args) {
			parent::__construct(...$args);
			if (is_string($this->body ?? null)) {
				$this->body = FeedJunkCleanerExtension::clean($this->body);
			}
		}
	}
} else {
	class FeedJunkCleanerFile extends SimplePie_File {
		public function __construct(...$args) {
			parent::__construct(...$args);
			if (is_string($this->body ?? null)) {
				$this->body = FeedJunkCleanerExtension::clean($this->body);
			}
		}
	}
}

final class FeedJunkCleanerExtension extends Minz_Extension {
	public function init(): void {
		$this->registerHook('simplepie_before_init', [$this, 'onSimplePieBeforeInit']);
	}

	/** @param object $simplePie */
	public function onSimplePieBeforeInit($simplePie, $feed = null): void {
		if (method_exists($simplePie, 'get_registry') && class_exists('\SimplePie\File')) {
			$simplePie->get_registry()->register(\SimplePie\File::class, FeedJunkCleanerFile::class, true);
		} elseif (method_exists($simplePie, 'set_file_class')) {
			$simplePie->set_file_class('FeedJunkCleanerFile');
		}
	}

	/** Coupe tout ce qui suit la dernière balise fermante du document (</rss>, </feed> ou </rdf:RDF>). */
	public static function clean(string $body): string {
		if (preg_match('#^(.*</(?:rss|feed|rdf:RDF)\s*>)(.+)$#si', $body, $m) === 1 && trim($m[2]) !== '') {
			return $m[1] . "\n";
		}
		return $body;
	}
}
